def test_crop_issue_reporting_and_rag(client, auth_headers):
    # Setup farm and crop
    farm = client.post('/api/v1/farms', headers=auth_headers, json={'name': 'Karnal Wheat Farm'}).get_json()['farm']
    crop = client.post('/api/v1/crops', headers=auth_headers, json={
        'farm_id': farm['id'],
        'crop_name': 'Paddy (Rice)',
        'variety': 'PB-1121'
    }).get_json()['crop']

    # Report problem with symptoms matching blast
    issue_res = client.post('/api/v1/crop-issues', headers=auth_headers, json={
        'crop_id': crop['id'],
        'title': 'Spindle spots on paddy leaves',
        'symptoms': 'Spindle shaped brown spots with grey center on leaves spreading after rain'
    })
    assert issue_res.status_code == 201
    data = issue_res.get_json()
    issue = data['issue']
    assert issue['status'] == 'open'
    assert 'Blast' in issue['diagnosis_estimate'] or 'Suspected' in issue['diagnosis_estimate']
    
    # Assert real follow-up task was scheduled
    assert 'scheduled_followup' in data
    assert data['scheduled_followup']['status'] == 'pending'

    # Add an observation
    obs_res = client.post(f"/api/v1/crop-issues/{issue['id']}/observations", headers=auth_headers, json={
        'notes': 'Applied recommended bio-control Trichoderma',
        'symptom_change': 'improving',
        'action_taken': 'Biocontrol spray'
    })
    assert obs_res.status_code == 201
    assert obs_res.get_json()['issue']['status'] == 'improving'

    # Mark resolved
    resolve_res = client.patch(f"/api/v1/crop-issues/{issue['id']}", headers=auth_headers, json={
        'status': 'resolved'
    })
    assert resolve_res.status_code == 200
    assert resolve_res.get_json()['issue']['status'] == 'resolved'
