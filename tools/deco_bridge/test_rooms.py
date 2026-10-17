import base64
import json
import unittest
from deco_bridge import configured_room, normalize

class RoomBindings(unittest.TestCase):
    def test_local_plain_and_base64_names_map_to_opaque_room_keys(self):
        bindings={'r1':['Synthetic Node A'], 'r2':['Synthetic Node B']}
        self.assertEqual(configured_room({'nickname':'Synthetic Node A'},bindings),'r1')
        self.assertEqual(configured_room({'custom_nickname':base64.b64encode(b'Synthetic Node B').decode()},bindings),'r2')
        self.assertIsNone(configured_room({'nickname':'Unknown'},bindings))
        self.assertIsNone(configured_room({'nickname':'Synthetic Node A','custom_nickname':'Synthetic Node B'},bindings))
        self.assertIsNone(configured_room({'nickname':'Synthetic Node A'},{'raw personal name':['Synthetic Node A']}))

    def test_duplicate_bindings_are_unresolved_and_names_do_not_escape(self):
        rows=[{'mac':'02:00:00:00:00:01','nickname':'Synthetic Node A'}, {'mac':'02:00:00:00:00:02','nickname':'Synthetic Node A'}]
        c={'responses':{'devices':{'device_list':rows},'clients':{'client_list':[]}}}
        out=normalize(c,b'synthetic-salt',room_bindings={'r1':['Synthetic Node A']})
        self.assertTrue(all(n['room_id'] is None for n in out['nodes']));self.assertNotIn('Synthetic Node A',json.dumps(out))
        rows.pop();out=normalize(c,b'synthetic-salt',room_bindings={'r1':['Synthetic Node A']})
        self.assertEqual(out['nodes'][0]['room_id'],'r1')

if __name__=='__main__':unittest.main()
