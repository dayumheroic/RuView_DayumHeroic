import json
import math
import unittest
from unittest.mock import patch
from research_feed import CAPABILITIES, dbm_to_nanowatts, ordinal_to_dbm, projection, echo, cached_targets


class FeedTests(unittest.TestCase):
    def test_physical_units_and_noninvertible_ordinal(self):
        for dbm, nw in [(-30, 1000), (-60, 1), (-90, .001)]:
            self.assertAlmostEqual(dbm_to_nanowatts(dbm), nw)
        for value in [True, math.inf, "-50", None]:
            self.assertIsNone(dbm_to_nanowatts(value))
        for value in [0, 1, 2, 3]:
            self.assertIsNone(ordinal_to_dbm(value))

    def test_export_selects_fields_without_target_or_identifiers(self):
        v = {"schema": "ruview.bridge.v0", "capabilities": CAPABILITIES, "target": {"secret": "PRIVATE_MARKER"},
             "radio": {"source": "macos_corewlan", "source_state": "live_unverified", "available": True,
                       "complex_csi": False, "rssi_dbm": -60, "noise_dbm": -90, "ssid": "PRIVATE_MARKER"},
             "mesh": {"source_state": "live_unverified", "nodes": [{"id": "a" * 24, "mac": "PRIVATE_MARKER",
                        "signal": {"band2_4": 0, "band5": 3}, "online": None}], "clients": None}}
        result = projection(v, "b" * 32, 0, [])
        self.assertNotIn("PRIVATE_MARKER", json.dumps(result))
        self.assertIsNone(result["mesh"]["clients"])
        self.assertEqual(result["mesh"]["nodes"][0]["signal_2g"], 0)
        v["radio"]["source_state"] = "synthetic"
        with self.assertRaises(ValueError):
            projection(v, "b" * 32, 0, [])

    def test_ping_failure_is_unknown_and_wall_bound_is_set(self):
        import subprocess
        with patch("research_feed.subprocess.run", side_effect=subprocess.TimeoutExpired("ping", 6)) as run:
            result = echo("192.168.50.2")
            self.assertIsNone(result["rtt_ms"])
            self.assertIsNone(result["loss_percent"])
            self.assertEqual(run.call_args.kwargs["timeout"], 6)
            self.assertFalse(run.call_args.kwargs.get("shell", False))

    def test_probes_require_on_link_gateway_identity_and_do_not_select_multicast(self):
        import subprocess
        lines = b'? (192.168.50.1) at aa:bb:cc:dd:ee:1 on en0 ifscope [ethernet]\n? (192.168.50.3) at aa:bb:cc:dd:ee:3 on en0 ifscope [ethernet]\n? (224.0.0.251) at 1:0:5e:0:0:fb on en0 ifscope [ethernet]\n'
        def outputs(*_args, **_kwargs):
            arg = _args[0]
            data = b'192.168.50.2\n' if arg[1] == 'getifaddr' else b'255.255.255.0\n' if arg[1] == 'getoption' else lines
            return subprocess.CompletedProcess(arg, 0, data)
        with patch('research_feed.subprocess.run', side_effect=outputs):
            self.assertEqual(cached_targets('192.168.50.1', 'aabbccddee01'), ['192.168.50.1', '192.168.50.3'])
            with self.assertRaises(ValueError):
                cached_targets('192.168.50.1', '000000000000')


if __name__ == "__main__":
    unittest.main()
