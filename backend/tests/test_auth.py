def test_empty_database_on_start(client):
    res = client.get('/api/v1/health/live')
    assert res.status_code == 200
    res = client.get('/api/v1/health/ready')
    assert res.status_code == 200

def test_user_registration_and_login(client):
    # Register
    reg_res = client.post('/api/v1/auth/register', json={
        'username': 'suresh_kumar',
        'password': 'Password999!',
        'full_name': 'Suresh Kumar',
        'preferred_language': 'hi',
        'state': 'Punjab'
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert 'token' in reg_data
    assert reg_data['user']['username'] == 'suresh_kumar'
    assert reg_data['profile']['full_name'] == 'Suresh Kumar'

    # Duplicate username should fail
    dup_res = client.post('/api/v1/auth/register', json={
        'username': 'suresh_kumar',
        'password': 'AnotherPassword!'
    })
    assert dup_res.status_code == 409

    # Login
    login_res = client.post('/api/v1/auth/login', json={
        'username': 'suresh_kumar',
        'password': 'Password999!'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert 'token' in login_data

    # Invalid login
    bad_login = client.post('/api/v1/auth/login', json={
        'username': 'suresh_kumar',
        'password': 'WrongPassword!'
    })
    assert bad_login.status_code == 401

def test_profile_update_and_me(client, auth_headers):
    me_res = client.get('/api/v1/auth/me', headers=auth_headers)
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data['user']['username'] == 'ramesh_patel'

    patch_res = client.patch('/api/v1/auth/profile', headers=auth_headers, json={
        'full_name': 'Ramesh Bhai Patel',
        'preferred_language': 'en',
        'location_consent': True,
        'quiet_hours_start': 22,
        'quiet_hours_end': 5
    })
    assert patch_res.status_code == 200
    patch_data = patch_res.get_json()
    assert patch_data['profile']['full_name'] == 'Ramesh Bhai Patel'
    assert patch_data['profile']['preferred_language'] == 'en'
    assert patch_data['profile']['location_consent'] is True
