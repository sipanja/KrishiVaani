def test_farm_and_crop_lifecycle(client, auth_headers):
    # 1. Create farm
    farm_res = client.post('/api/v1/farms', headers=auth_headers, json={
        'name': 'Green Acres Navsari',
        'latitude': 20.9467,
        'longitude': 72.9520,
        'size_value': 4.5,
        'size_unit': 'Acres',
        'soil_type': 'Black',
        'irrigation_method': 'Drip'
    })
    assert farm_res.status_code == 201
    farm = farm_res.get_json()['farm']
    farm_id = farm['id']
    assert farm['name'] == 'Green Acres Navsari'

    # 2. List farms
    list_res = client.get('/api/v1/farms', headers=auth_headers)
    assert list_res.status_code == 200
    assert list_res.get_json()['total'] == 1

    # 3. Create crop on farm
    crop_res = client.post('/api/v1/crops', headers=auth_headers, json={
        'farm_id': farm_id,
        'crop_name': 'Paddy (Rice)',
        'variety': 'Gurjari',
        'growth_stage': 'Vegetative / Tillering',
        'sowing_date': '2026-06-15'
    })
    assert crop_res.status_code == 201
    crop = crop_res.get_json()['crop']
    crop_id = crop['id']
    assert crop['crop_name'] == 'Paddy (Rice)'

    # 4. Update crop growth stage
    update_res = client.put(f'/api/v1/crops/{crop_id}', headers=auth_headers, json={
        'growth_stage': 'Flowering / Panicle Initiation'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['crop']['growth_stage'] == 'Flowering / Panicle Initiation'

def test_cross_user_isolation(client, auth_headers):
    # User 1 creates farm
    farm_res = client.post('/api/v1/farms', headers=auth_headers, json={'name': "User 1 Farm"})
    farm_id = farm_res.get_json()['farm']['id']

    # Register User 2
    user2_res = client.post('/api/v1/auth/register', json={
        'username': 'second_farmer',
        'password': 'Pass123Password!',
        'full_name': 'Second Farmer'
    })
    user2_token = user2_res.get_json()['token']
    user2_headers = {
        'Authorization': f'Bearer {user2_token}',
        'Content-Type': 'application/json'
    }

    # User 2 attempts to get User 1's farm -> must return 404 Not Found
    get_res = client.get(f'/api/v1/farms/{farm_id}', headers=user2_headers)
    assert get_res.status_code == 404

    # User 2 attempts to delete User 1's farm -> must return 404 Not Found
    del_res = client.delete(f'/api/v1/farms/{farm_id}', headers=user2_headers)
    assert del_res.status_code == 404
