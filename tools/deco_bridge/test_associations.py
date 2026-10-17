import json
import time
from pathlib import Path
import unittest
from datetime import datetime, timezone
from unittest.mock import Mock
from deco_bridge import AssociationTracker, BridgeError, Session, identity_alias, normalize
from bridge_service import State
from research_feed import association_export

MACS = ['02:00:00:00:00:01', '02:00:00:00:00:02']
CLIENT = '02:00:00:00:01:01'
SALT = b'synthetic-association-fixture'
def capture():
    return {'observed_at': datetime.now(timezone.utc).isoformat(), 'responses': {'devices': {'device_list': [
        {'mac': MACS[0], 'role': 'master', 'device_model': 'M5'},
        {'mac': MACS[1], 'role': 'slave', 'previous': MACS[0], 'device_model': 'M4R'}]},
        'clients': {'client_list': [{'mac': CLIENT, 'online': True}]}}}

class Associations(unittest.TestCase):
    def test_node_filter_rejects_unknown_or_malformed_before_network(self):
        s=Session(Mock());s.token='fixture';s._fixed_read=Mock(return_value={})
        for bad in ['reboot', '02:00:00:00:00:ff', None]:
            with self.assertRaises(BridgeError): s.read_node_clients(bad, MACS)
        s._fixed_read.assert_not_called()
        s.read_node_clients(MACS[0], MACS)
        s._fixed_read.assert_called_once_with('admin/client','client_list',{'device_mac':MACS[0]})

    def test_group_membership_parent_and_changes_keep_private_identity_out(self):
        c=capture();n=normalize(c,SALT);t=AssociationTracker();s=Mock()
        s.read_node_clients.side_effect=lambda mac,_known:{'client_list':[{'mac':CLIENT}] if mac==MACS[0] else []}
        t.collect(s,c,SALT);v=t.view(n['clients'],c['observed_at'])
        self.assertEqual(s.read_node_clients.call_count,2)
        self.assertEqual(v['clients'][0]['node_id'],n['nodes'][0]['id'])
        self.assertEqual(n['nodes'][1]['parent_id'],n['nodes'][0]['id']);self.assertTrue(n['nodes'][0]['is_main'])
        s.read_node_clients.side_effect=lambda mac,_known:{'client_list':[{'mac':CLIENT}] if mac==MACS[1] else []}
        t.collect(s,c,SALT);v=t.view(n['clients'],c['observed_at'])
        self.assertEqual(len(v['events']),1);self.assertEqual(v['events'][0]['kind'],'observed_attachment_change')
        self.assertNotIn(CLIENT,json.dumps(v));self.assertNotIn(MACS[0],json.dumps(v))

    def test_ignored_filter_is_ambiguous_not_a_roam_and_old_data_expires(self):
        c=capture();n=normalize(c,SALT);t=AssociationTracker();s=Mock()
        s.read_node_clients.return_value={'client_list':[{'mac':CLIENT}]}
        t.collect(s,c,SALT);v=t.view(n['clients'],c['observed_at'])
        self.assertEqual(v['clients'][0]['state'],'ambiguous');self.assertIsNone(v['clients'][0]['node_id']);self.assertEqual(v['events'],[])
        v=t.view(n['clients'],c['observed_at'],time.time()+301)
        self.assertEqual(v['clients'][0]['state'],'unknown');self.assertEqual(v['node_observations'],[])

    def test_optional_failure_stops_filtered_reads_and_retains_unknown(self):
        c=capture();t=AssociationTracker();s=Mock();s.read_node_clients.side_effect=BridgeError('PRIVATE_MARKER')
        t.collect(s,c,SALT);t.collect(s,c,SALT)
        self.assertEqual(s.read_node_clients.call_count,1)
        v=t.view(normalize(c,SALT)['clients'],c['observed_at'])
        self.assertEqual(v['state'],'stopped');self.assertNotIn('PRIVATE_MARKER',json.dumps(v))

    def test_invalid_parent_or_model_is_not_forwarded(self):
        c=capture();c['responses']['devices']['device_list'][1].update(previous=CLIENT,device_model='PRIVATE_MARKER')
        c['responses']['devices']['device_list'][0]['previous']=MACS[1]
        n=normalize(c,SALT);self.assertIsNone(n['nodes'][1]['parent_id']);self.assertIsNone(n['nodes'][1]['model'])
        self.assertIsNone(n['nodes'][0]['parent_id'])

    def test_optional_transient_has_one_delayed_same_node_retry_without_login(self):
        c=capture();t=AssociationTracker();s=Mock()
        s.read_node_clients.side_effect=[BridgeError('Network request timed out'),{'client_list':[]},BridgeError('TLS negotiation or record failure')]
        t.collect(s,c,SALT)
        self.assertFalse(t.disabled);self.assertEqual(t.cursor,0)
        self.assertEqual(t.diagnostic,{'category':'network_timeout'})
        t.collect(s,c,SALT);t.collect(s,c,SALT)
        self.assertTrue(t.disabled);self.assertEqual(s.read_node_clients.call_count,3)
        self.assertEqual(s.read_node_clients.call_args_list[0],s.read_node_clients.call_args_list[1]);s.login.assert_not_called()

    def test_local_diagnostic_is_bounded_and_excluded_from_export(self):
        c=capture();t=AssociationTracker();s=Mock()
        e=BridgeError('Router rejected request; stopped without automatic retry');e.router_code=-1
        s.read_node_clients.side_effect=e;t.collect(s,c,SALT)
        v=t.view(normalize(c,SALT)['clients'],c['observed_at'])
        self.assertEqual(v['local_diagnostic'],{'category':'router_rejected','router_code':-1})
        self.assertNotIn('local_diagnostic',association_export(v))
        t=AssociationTracker();s.read_node_clients.side_effect=None;s.read_node_clients.return_value={'PRIVATE_MARKER':'PRIVATE_MARKER'}
        t.collect(s,c,SALT)
        self.assertEqual(t.diagnostic,{'category':'filtered_schema','result_is_object':True,'client_list_is_array':False})
        self.assertNotIn('PRIVATE_MARKER',json.dumps(t.view([],c['observed_at'])))

    def test_only_an_empty_object_can_represent_an_empty_client_list(self):
        c=capture();s=Mock();s.read_node_clients.return_value={'client_list':{}}
        t=AssociationTracker();t.collect(s,c,SALT)
        self.assertFalse(t.disabled);self.assertEqual(len(t.groups),2)
        v=t.view([],c['observed_at']);self.assertTrue(all(w['client_list_type']=='object' and w['entries']==0 for w in v['local_schema_witnesses'].values()))
        self.assertNotIn('local_schema_witnesses',association_export(v))
        for result in [{'client_list':None},{},{'client_list':{'PRIVATE_MARKER':[]}}]:
            t=AssociationTracker();s.read_node_clients.return_value=result;t.collect(s,c,SALT)
            self.assertTrue(t.disabled);self.assertEqual(t.groups,{})

    def test_optional_failure_does_not_stop_authenticated_base_collection(self):
        c=capture();session=Mock();session.read.side_effect=lambda name:c['responses'][name]
        session.read_node_clients.side_effect=BridgeError('Unsupported filtered client schema')
        state=State({'host':'192.168.50.1','pin':'0'*64,'bridge_key':'a'*64,'associations_enabled':True},Path('unused'),session_factory=lambda:session)
        try:
            state.connect('synthetic-password',True)
            deadline=time.monotonic()+3
            while time.monotonic()<deadline:
                result=state.snapshot()
                if result['mesh'].get('associations',{}).get('state')=='stopped':break
                time.sleep(.01)
            self.assertEqual(result['connection'],'connected');self.assertEqual(len(result['mesh']['nodes']),2)
            self.assertEqual(result['mesh']['associations']['failure_reason'],'filtered_read_failed')
            session.login.assert_called_once();self.assertEqual(session.read_node_clients.call_count,1)
        finally:
            state.stop.set();state.mesh_stop.set()
            state.mesh_worker.join(2)

    def test_publisher_rebuilds_aliases_and_rejects_raw_identifiers(self):
        c=capture();t=AssociationTracker();s=Mock();s.read_node_clients.return_value={'client_list':[{'mac':CLIENT}]}
        t.collect(s,c,SALT);v=t.view(normalize(c,SALT)['clients'],c['observed_at']);v['secret']='PRIVATE_MARKER'
        out=association_export(v);self.assertNotIn('PRIVATE_MARKER',json.dumps(out));self.assertNotIn('client_ids',json.dumps(out))
        v['clients'][0]['client_id']=CLIENT
        with self.assertRaises(ValueError):association_export(v)

    def test_older_positive_claim_cannot_generate_reversed_change_history(self):
        c=capture();n=normalize(c,SALT);t=AssociationTracker();client=n['clients'][0]['id'];a=n['nodes'][0]['id'];b=n['nodes'][1]['id']
        t.previous[client]={'node_id':a,'observed_at':datetime.fromtimestamp(time.time(),timezone.utc).isoformat()}
        t.groups[b]={'node_id':b,'observed_at':datetime.fromtimestamp(time.time()-20,timezone.utc).isoformat(),'client_ids':[client]}
        v=t.view(n['clients'],c['observed_at']);self.assertEqual(v['events'],[]);self.assertEqual(t.previous[client]['node_id'],a)

if __name__ == '__main__': unittest.main()
