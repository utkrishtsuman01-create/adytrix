#!/usr/bin/env python3
"""
Backend API tests for ADYTRIX ecommerce platform
Focus: Image upload and product image limit validation
"""
import requests
import io
from PIL import Image

BASE_URL = "https://b12882fe-53d7-4067-a94f-cc49f19244f7.preview.emergentagent.com/api"
COOKIE_NAME = "adytrix_session"

def create_test_image(width=100, height=100, format='PNG'):
    """Create a valid test image in memory"""
    img = Image.new('RGB', (width, height), color='red')
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf

def create_fake_image():
    """Create fake image data (text with .png extension)"""
    return io.BytesIO(b"This is not a real image file")

def admin_login():
    """Login as admin and return session cookie"""
    print("\n=== ADMIN LOGIN ===")
    resp = requests.post(f"{BASE_URL}/auth/admin-login", json={
        "phone": "9999999999",
        "password": "Adytrix@Admin2025"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        cookie = resp.cookies.get(COOKIE_NAME)
        print(f"✅ Admin login successful, cookie: {cookie[:20]}..." if cookie else "❌ No cookie received")
        return {COOKIE_NAME: cookie}
    else:
        print(f"❌ Admin login failed: {resp.text}")
        return None

def customer_signup():
    """Create a fresh customer account and return session cookie"""
    print("\n=== CUSTOMER SIGNUP ===")
    import random
    rand = random.randint(10000, 99999)
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "name": f"Test Customer {rand}",
        "email": f"customer{rand}@test.com",
        "phone": f"98765{rand:05d}"[:10],
        "password": "Test@123"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        cookie = resp.cookies.get(COOKIE_NAME)
        print(f"✅ Customer signup successful")
        return {COOKIE_NAME: cookie}
    else:
        print(f"❌ Customer signup failed: {resp.text}")
        return None

def test_image_upload_single_valid(admin_cookies):
    """Test A1: Upload 1 valid small PNG as admin => expect 201 with urls"""
    print("\n=== TEST A1: Upload 1 valid PNG as admin ===")
    try:
        img_data = create_test_image(100, 100, 'PNG')
        files = {'images': ('test.png', img_data, 'image/png')}
        resp = requests.post(f"{BASE_URL}/admin/upload", files=files, cookies=admin_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 201:
            data = resp.json()
            if 'urls' in data and len(data['urls']) == 1 and data['urls'][0].startswith('/api/images/'):
                print(f"✅ PASS: Single image uploaded successfully, URL: {data['urls'][0]}")
                return True, data['urls'][0]
            else:
                print(f"❌ FAIL: Invalid response format")
                return False, None
        else:
            print(f"❌ FAIL: Expected 201, got {resp.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False, None

def test_image_retrieval(image_url):
    """Test A2: GET the uploaded image => expect 200 with image content-type"""
    print(f"\n=== TEST A2: Retrieve uploaded image ===")
    try:
        full_url = BASE_URL.replace('/api', '') + image_url
        resp = requests.get(full_url)
        print(f"Status: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('Content-Type')}")
        print(f"Content-Length: {len(resp.content)} bytes")
        
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', '')
            if content_type.startswith('image/') and len(resp.content) > 0:
                print(f"✅ PASS: Image retrieved successfully")
                return True
            else:
                print(f"❌ FAIL: Invalid content-type or empty content")
                return False
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_image_upload_six_images(admin_cookies):
    """Test A3: Upload 6 valid images => expect 422 (max 5)"""
    print("\n=== TEST A3: Upload 6 images (should fail) ===")
    try:
        files = []
        for i in range(6):
            img_data = create_test_image(50, 50, 'PNG')
            files.append(('images', (f'test{i}.png', img_data, 'image/png')))
        
        resp = requests.post(f"{BASE_URL}/admin/upload", files=files, cookies=admin_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 422:
            data = resp.json()
            if 'Maximum 5 images' in data.get('error', ''):
                print(f"✅ PASS: Correctly rejected 6 images")
                return True
            else:
                print(f"❌ FAIL: Wrong error message")
                return False
        else:
            print(f"❌ FAIL: Expected 422, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_image_upload_fake_image(admin_cookies):
    """Test A4: Upload fake image (text with .png name) => expect 422"""
    print("\n=== TEST A4: Upload fake image (wrong magic bytes) ===")
    try:
        fake_data = create_fake_image()
        files = {'images': ('fake.png', fake_data, 'image/png')}
        resp = requests.post(f"{BASE_URL}/admin/upload", files=files, cookies=admin_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 422:
            data = resp.json()
            error = data.get('error', '')
            if 'content does not match' in error.lower() or 'magic' in error.lower():
                print(f"✅ PASS: Correctly rejected fake image")
                return True
            else:
                print(f"❌ FAIL: Wrong error message: {error}")
                return False
        else:
            print(f"❌ FAIL: Expected 422, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_image_upload_no_auth():
    """Test A5: Upload without auth => expect 403"""
    print("\n=== TEST A5: Upload without auth ===")
    try:
        img_data = create_test_image(50, 50, 'PNG')
        files = {'images': ('test.png', img_data, 'image/png')}
        resp = requests.post(f"{BASE_URL}/admin/upload", files=files)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 403:
            print(f"✅ PASS: Correctly rejected unauthenticated request")
            return True
        else:
            print(f"❌ FAIL: Expected 403, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_image_upload_customer_auth(customer_cookies):
    """Test A6: Upload as customer (non-admin) => expect 403"""
    print("\n=== TEST A6: Upload as customer (non-admin) ===")
    try:
        img_data = create_test_image(50, 50, 'PNG')
        files = {'images': ('test.png', img_data, 'image/png')}
        resp = requests.post(f"{BASE_URL}/admin/upload", files=files, cookies=customer_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 403:
            print(f"✅ PASS: Correctly rejected customer request")
            return True
        else:
            print(f"❌ FAIL: Expected 403, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_product_with_six_images(admin_cookies):
    """Test B1: Create product with 6 image URLs => expect 400 'Maximum 5 images allowed'"""
    print("\n=== TEST B1: Create product with 6 images (should fail) ===")
    try:
        # First get a valid category
        resp = requests.get(f"{BASE_URL}/categories")
        if resp.status_code != 200:
            print(f"❌ FAIL: Cannot fetch categories")
            return False
        
        categories = resp.json().get('categories', [])
        if not categories:
            print(f"❌ FAIL: No categories available")
            return False
        
        category_id = categories[0]['id']
        
        # Try to create product with 6 images
        product_data = {
            "name": "Test Product with 6 Images",
            "categoryId": category_id,
            "mrp": 1000,
            "discountedPrice": 800,
            "description": "Test product",
            "images": [
                "/api/images/img1",
                "/api/images/img2",
                "/api/images/img3",
                "/api/images/img4",
                "/api/images/img5",
                "/api/images/img6"
            ],
            "stock": 10,
            "available": True
        }
        
        resp = requests.post(f"{BASE_URL}/admin/products", json=product_data, cookies=admin_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 400:
            data = resp.json()
            error = data.get('error', '')
            if 'Maximum 5 images allowed' in error:
                print(f"✅ PASS: Correctly rejected product with 6 images")
                return True
            else:
                print(f"❌ FAIL: Wrong error message: {error}")
                return False
        else:
            print(f"❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def test_product_with_five_images(admin_cookies):
    """Test B2: Create product with exactly 5 images => expect 201"""
    print("\n=== TEST B2: Create product with 5 images (should succeed) ===")
    try:
        # Get a valid category
        resp = requests.get(f"{BASE_URL}/categories")
        if resp.status_code != 200:
            print(f"❌ FAIL: Cannot fetch categories")
            return False
        
        categories = resp.json().get('categories', [])
        if not categories:
            print(f"❌ FAIL: No categories available")
            return False
        
        category_id = categories[0]['id']
        
        # Create product with exactly 5 images
        product_data = {
            "name": "Test Product with 5 Images",
            "categoryId": category_id,
            "mrp": 1000,
            "discountedPrice": 800,
            "description": "Test product",
            "images": [
                "/api/images/img1",
                "/api/images/img2",
                "/api/images/img3",
                "/api/images/img4",
                "/api/images/img5"
            ],
            "stock": 10,
            "available": True
        }
        
        resp = requests.post(f"{BASE_URL}/admin/products", json=product_data, cookies=admin_cookies)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 201:
            data = resp.json()
            product = data.get('product', {})
            if len(product.get('images', [])) == 5:
                print(f"✅ PASS: Product created successfully with 5 images")
                return True
            else:
                print(f"❌ FAIL: Product created but images count mismatch")
                return False
        else:
            print(f"❌ FAIL: Expected 201, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
        return False

def main():
    print("=" * 80)
    print("ADYTRIX BACKEND RE-TEST: IMAGE UPLOAD & PRODUCT IMAGE LIMIT")
    print("=" * 80)
    
    results = {
        'passed': 0,
        'failed': 0,
        'tests': []
    }
    
    # Setup: Login as admin
    admin_cookies = admin_login()
    if not admin_cookies:
        print("\n❌ CRITICAL: Cannot proceed without admin authentication")
        return
    
    # Setup: Create customer account
    customer_cookies = customer_signup()
    if not customer_cookies:
        print("\n⚠️ WARNING: Customer tests will be skipped")
    
    print("\n" + "=" * 80)
    print("SECTION A: IMAGE UPLOAD TESTS")
    print("=" * 80)
    
    # Test A1: Upload single valid image
    success, image_url = test_image_upload_single_valid(admin_cookies)
    results['tests'].append(('A1: Upload 1 valid PNG', success))
    if success:
        results['passed'] += 1
        
        # Test A2: Retrieve the uploaded image
        success = test_image_retrieval(image_url)
        results['tests'].append(('A2: Retrieve uploaded image', success))
        if success:
            results['passed'] += 1
        else:
            results['failed'] += 1
    else:
        results['failed'] += 1
        results['tests'].append(('A2: Retrieve uploaded image', False))
        results['failed'] += 1
    
    # Test A3: Upload 6 images (should fail)
    success = test_image_upload_six_images(admin_cookies)
    results['tests'].append(('A3: Upload 6 images (reject)', success))
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test A4: Upload fake image
    success = test_image_upload_fake_image(admin_cookies)
    results['tests'].append(('A4: Upload fake image (reject)', success))
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test A5: Upload without auth
    success = test_image_upload_no_auth()
    results['tests'].append(('A5: Upload without auth (reject)', success))
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test A6: Upload as customer
    if customer_cookies:
        success = test_image_upload_customer_auth(customer_cookies)
        results['tests'].append(('A6: Upload as customer (reject)', success))
        if success:
            results['passed'] += 1
        else:
            results['failed'] += 1
    else:
        results['tests'].append(('A6: Upload as customer (reject)', False))
        results['failed'] += 1
    
    print("\n" + "=" * 80)
    print("SECTION B: PRODUCT IMAGE LIMIT VALIDATION")
    print("=" * 80)
    
    # Test B1: Create product with 6 images
    success = test_product_with_six_images(admin_cookies)
    results['tests'].append(('B1: Product with 6 images (reject)', success))
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test B2: Create product with 5 images
    success = test_product_with_five_images(admin_cookies)
    results['tests'].append(('B2: Product with 5 images (accept)', success))
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    for test_name, passed in results['tests']:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "-" * 80)
    print(f"Total: {results['passed'] + results['failed']} tests")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print("=" * 80)
    
    if results['failed'] == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {results['failed']} TEST(S) FAILED")

if __name__ == "__main__":
    main()
