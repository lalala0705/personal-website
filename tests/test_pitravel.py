import importlib.util
import json
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('sync_pitravel',Path(__file__).parents[1]/'scripts/sync-pitravel.py')
sync=importlib.util.module_from_spec(spec);spec.loader.exec_module(sync)

class ItineraryTest(unittest.TestCase):
    def source(self):
        return {'tripId':'test','journeyId':'7694934510752722618','startDate':'2026-10-11','endDate':'2026-10-13'}
    def payload(self):
        return {'code':0,'success':True,'data':{'journey':{'name':'测试行程','start_time':1791648000000,'end_time':1791907199000,
            'user_info':{'mobile':'PRIVATE'},'image_list':['PRIVATE_IMAGE'],
            'day_plans':[{'timestamp':1791648000000,'events':[{'name':'敬亭山','start_time':'09:00','end_time':'12:00','note':'原备注','user_id':'PRIVATE'}]},
                         {'day_plan_name':'待计划','events':[]}]}}}
    def test_only_selected_itinerary_fields_are_published(self):
        plan=sync.public_itinerary(self.payload(),self.source())
        self.assertEqual(len(plan['days']),1)
        self.assertEqual(plan['days'][0]['date'],'2026-10-11')
        self.assertEqual(plan['days'][0]['events'][0]['note'],'原备注')
        self.assertNotIn('PRIVATE',json.dumps(plan))
        self.assertNotIn('image_list',plan)
    def test_fail_if_sharing_revoked_or_dates_change(self):
        for change in ['sharing','date']:
            payload=self.payload()
            if change=='sharing':payload['success']=False
            else:payload['data']['journey']['start_time']=1791734400000
            with self.assertRaises(ValueError):sync.public_itinerary(payload,self.source())
    def test_invalid_time_is_not_silently_published(self):
        payload=self.payload();payload['data']['journey']['day_plans'][0]['events'][0]['start_time']='27:80'
        with self.assertRaises(ValueError):sync.public_itinerary(payload,self.source())
