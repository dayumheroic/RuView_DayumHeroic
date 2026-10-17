// Read current-link RF metadata through Apple's public CoreWLAN API.
// No scanning, monitor mode, identifiers, router login or network changes.
import CoreWLAN
import Foundation

struct Sample: Encodable {
    let schema = "ruview.local_link.v0"
    let source = "macos_corewlan"
    let source_state = "live_unverified"
    let observed_at: String
    let available: Bool
    let rssi_dbm: Int?
    let noise_dbm: Int?
    let transmit_rate_mbps: Double?
    let channel: Int?
    let complex_csi = false
}

func usage() -> Never {
    FileHandle.standardError.write(Data("Usage: mac-radio [--samples 1..120] [--interval 1..60]\n".utf8))
    exit(2)
}

var samples = 1
var interval = 1
var seen = Set<String>()
let arguments = Array(CommandLine.arguments.dropFirst())
if arguments.count % 2 != 0 { usage() }
for index in stride(from: 0, to: arguments.count, by: 2) {
    let name = arguments[index]
    guard seen.insert(name).inserted, let value = Int(arguments[index + 1]) else { usage() }
    switch name {
    case "--samples":
        guard (1...120).contains(value) else { usage() }
        samples = value
    case "--interval":
        guard (1...60).contains(value) else { usage() }
        interval = value
    default: usage()
    }
}

let client = CWWiFiClient.shared()
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]
let clock = ISO8601DateFormatter()
for index in 0..<samples {
    let interface = client.interface()
    let rssi = interface?.rssiValue() ?? 0
    let noise = interface?.noiseMeasurement() ?? 0
    // Apple reports zero on error/disconnection; zero is never a real sample.
    let available = interface?.powerOn() == true && interface?.serviceActive() == true
        && (-127 ... -1).contains(rssi)
    let rate = interface?.transmitRate() ?? 0
    let sample = Sample(
        observed_at: clock.string(from: Date()), available: available,
        rssi_dbm: available ? rssi : nil,
        noise_dbm: available && (-127 ... -1).contains(noise) ? noise : nil,
        transmit_rate_mbps: available && rate.isFinite && rate > 0 ? rate : nil,
        channel: available ? interface?.wlanChannel()?.channelNumber : nil
    )
    do {
        var data = try encoder.encode(sample)
        data.append(0x0a)
        FileHandle.standardOutput.write(data)
    } catch {
        FileHandle.standardError.write(Data("Radio sample could not be encoded.\n".utf8))
        exit(1)
    }
    if index + 1 < samples { Thread.sleep(forTimeInterval: Double(interval)) }
}
