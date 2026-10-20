// Native lifetime owner for the loopback service and bundled dashboard.
import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var child: Process?
    var quitting = false
    var port = 8766

    func fail(_ message: String) {
        guard !quitting else { return }
        quitting = true
        let alert = NSAlert()
        alert.messageText = "RuView Deco Bridge"
        alert.informativeText = message
        alert.addButton(withTitle: "Quit")
        alert.runModal()
        NSApp.terminate(nil)
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let support = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/RuViewDecoBridge")
        guard let resources = Bundle.main.resourceURL else { fail("App resources are missing."); return }
        do {
            let raw = try Data(contentsOf: support.appendingPathComponent("config.json"))
            guard let config = try JSONSerialization.jsonObject(with: raw) as? [String: Any],
                  let key = config["bridge_key"] as? String, key.count == 64,
                  let configuredPort = config["port"] as? Int else {
                fail("Private configuration is incomplete. Run the local installer again."); return
            }
            port = configuredPort
            let menu = NSMenu()
            let item = NSMenuItem()
            menu.addItem(item)
            let appMenu = NSMenu()
            appMenu.addItem(withTitle: "Quit RuView Deco Bridge", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
            item.submenu = appMenu
            let editItem = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
            let editMenu = NSMenu(title: "Edit")
            for (title, action, key) in [("Cut", "cut:", "x"), ("Copy", "copy:", "c"),
                                         ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
                editMenu.addItem(withTitle: title, action: Selector(action), keyEquivalent: key)
            }
            editItem.submenu = editMenu
            menu.addItem(editItem)
            NSApp.mainMenu = menu
            let configuration = WKWebViewConfiguration()
            configuration.websiteDataStore = .nonPersistent()
            web = WKWebView(frame: .zero, configuration: configuration)
            web.navigationDelegate = self
            window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1120, height: 860),
                              styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
            window.title = "RuView · Deco Bridge"
            window.minSize = NSSize(width: 650, height: 550)
            window.contentView = web
            window.center()
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)

            let process = Process()
            let ready = Pipe()
            process.executableURL = support.appendingPathComponent("runtime/bin/python")
            process.arguments = [resources.appendingPathComponent("bridge_service.py").path,
                                 "--config", support.appendingPathComponent("config.json").path,
                                 "--radio-helper", resources.appendingPathComponent("mac-radio").path,
                                 "--assets", resources.appendingPathComponent("ui").path,
                                 "--parent-pid", String(ProcessInfo.processInfo.processIdentifier)]
            process.standardInput = FileHandle.nullDevice
            process.standardOutput = ready
            process.standardError = FileHandle.nullDevice
            process.terminationHandler = { [weak self] _ in
                DispatchQueue.main.async { self?.fail("The local bridge stopped. Check its private configuration and whether port \(configuredPort) is already occupied. Quit and reopen to retry.") }
            }
            child = process
            try process.run()
            DispatchQueue.global().async { [weak self] in
                let data = ready.fileHandleForReading.availableData
                DispatchQueue.main.async {
                    guard let self = self, !self.quitting else { return }
                    guard data == Data("RuView bridge ready\n".utf8), process.isRunning else {
                        self.fail("The local bridge did not become ready. No router password was sent."); return
                    }
                    var request = URLRequest(url: URL(string: "http://127.0.0.1:\(configuredPort)/")!)
                    request.setValue("Bearer " + key, forHTTPHeaderField: "Authorization")
                    request.cachePolicy = .reloadIgnoringLocalCacheData
                    self.web.load(request)
                }
            }
        } catch {
            fail("Could not start the private runtime. Use install_macos.py to install the local app and dependencies.")
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, url.scheme == "http", url.host == "127.0.0.1",
              url.port == port, navigationAction.targetFrame != nil else { decisionHandler(.cancel); return }
        decisionHandler(.allow)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) {
        quitting = true
        web?.stopLoading()
        if let process = child, process.isRunning { process.terminate() }
    }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.setActivationPolicy(.regular)
application.run()
