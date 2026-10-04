#!/usr/bin/env python3
"""
Razorpay Test Mode Payment Integration Tests for ADYTRIX
Tests: payment order creation, signature verification, idempotency, security
"""
import requests
import hmac
import hashlib
import random
import json

BASE_URL = "https://b12882fe-53d7-4067-a94f-cc49f19244f7.preview.emergentagent.com/api"
COOKIE_NAME = "adytrix_session"
RAZORPAY_KEY_SECRET = "1Z8L6T91kEcBi0gxjVWUfKLC"

def compute_signature(razorpay_order_id, razorpay_payment_id):
    """Compute HMAC SHA256 signature for Razorpay verification"""
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

def customer_signup():
    """Create a fresh customer account and return session cookie"""
    print("\n=== CUSTOMER SIGNUP ===")
    rand = random.randint(10000, 99999)
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "name": f"Rajesh Kumar {rand}",
        "email": f"rajesh.kumar{rand}@example.com",
        "phone": f"98765{rand:05d}"[:10],
        "password": "SecurePass@123"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        cookie = resp.cookies.get(COOKIE_NAME)
        user_data = resp.json()
        print(f"✅ Customer signup successful: {user_data.get('user', {}).get('name')}")
        return {COOKIE_NAME: cookie}, user_data.get('user', {})
    else:
        print(f"❌ Customer signup failed: {resp.text}")
        return None, None

def get_products():
    """Get available products"""
    print("\n=== GET PRODUCTS ===")
    resp = requests.get(f"{BASE_URL}/products")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        products = resp.json().get('products', [])
        print(f"✅ Found {len(products)} products")
        return products
    else:
        print(f"❌ Failed to get products: {resp.text}")
        return []

def create_order(cookies, product_id):
    """Create an order with Razorpay payment method"""
    print("\n=== CREATE ORDER ===")
    resp = requests.post(f"{BASE_URL}/orders", 
        cookies=cookies,
        json={
            "items": [{"productId": product_id, "quantity": 2}],
            "deliveryAddress": {
                "name": "Rajesh Kumar",
                "phone": "9876543210",
                "email": "rajesh.kumar@example.com",
                "address": "123 MG Road, Near City Mall",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postalCode": "400001"
            },
            "paymentMethod": "razorpay"
        })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        order = resp.json().get('order', {})
        print(f"✅ Order created: {order.get('orderNumber')}, Total: ₹{order.get('total')}")
        return order
    else:
        print(f"❌ Order creation failed: {resp.text}")
        return None

def test_payment_order_creation():
    """Test 1: POST /api/payment/order - Create Razorpay order"""
    print("\n" + "="*80)
    print("TEST 1: PAYMENT ORDER CREATION")
    print("="*80)
    
    # Setup: Create customer and order
    cookies, user = customer_signup()
    if not cookies:
        print("❌ TEST 1 FAILED: Could not create customer")
        return None, None, None
    
    products = get_products()
    if not products:
        print("❌ TEST 1 FAILED: No products available")
        return None, None, None
    
    product_id = products[0]['id']
    order = create_order(cookies, product_id)
    if not order:
        print("❌ TEST 1 FAILED: Could not create order")
        return None, None, None
    
    order_id = order['id']
    order_total = order['total']
    
    # Test 1a: Create payment order (authenticated customer)
    print("\n--- Test 1a: Create Razorpay order (authenticated) ---")
    resp = requests.post(f"{BASE_URL}/payment/order",
        cookies=cookies,
        json={"orderId": order_id})
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    
    if resp.status_code == 200:
        data = resp.json()
        razorpay_order_id = data.get('orderId')
        amount = data.get('amount')
        currency = data.get('currency')
        key_id = data.get('keyId')
        
        # Validate response
        checks = []
        checks.append(("Razorpay orderId starts with 'order_'", razorpay_order_id and razorpay_order_id.startswith('order_')))
        checks.append(("Amount in paise (total*100)", amount == order_total * 100))
        checks.append(("Currency is INR", currency == "INR"))
        checks.append(("keyId starts with 'rzp_test_'", key_id and key_id.startswith('rzp_test_')))
        checks.append(("No secret in response", RAZORPAY_KEY_SECRET not in json.dumps(data)))
        
        all_passed = all(check[1] for check in checks)
        for check_name, passed in checks:
            print(f"  {'✅' if passed else '❌'} {check_name}")
        
        if all_passed:
            print("✅ TEST 1a PASSED: Razorpay order created successfully")
        else:
            print("❌ TEST 1a FAILED: Response validation failed")
            return None, None, None
        
        # Test 1b: Call again for same order (should reuse)
        print("\n--- Test 1b: Reuse existing Razorpay order ---")
        resp2 = requests.post(f"{BASE_URL}/payment/order",
            cookies=cookies,
            json={"orderId": order_id})
        print(f"Status: {resp2.status_code}")
        data2 = resp2.json()
        print(f"Response: {json.dumps(data2, indent=2)}")
        
        if resp2.status_code == 200 and data2.get('orderId') == razorpay_order_id:
            print("✅ TEST 1b PASSED: Same Razorpay orderId reused (no duplicate creation)")
        else:
            print("❌ TEST 1b FAILED: Should reuse same Razorpay orderId")
        
        return cookies, order_id, razorpay_order_id
    else:
        print(f"❌ TEST 1a FAILED: Expected 200, got {resp.status_code}")
        return None, None, None

def test_payment_order_security(order_id, razorpay_order_id, customer_cookies):
    """Test 1c-1e: Security checks for payment order endpoint"""
    print("\n" + "="*80)
    print("TEST 1c-1e: PAYMENT ORDER SECURITY")
    print("="*80)
    
    # Test 1c: Unauthenticated request
    print("\n--- Test 1c: Unauthenticated request ---")
    resp = requests.post(f"{BASE_URL}/payment/order",
        json={"orderId": order_id})
    print(f"Status: {resp.status_code}")
    if resp.status_code == 401:
        print("✅ TEST 1c PASSED: Unauthenticated request rejected (401)")
    else:
        print(f"❌ TEST 1c FAILED: Expected 401, got {resp.status_code}")
    
    # Test 1d: Different customer trying to access
    print("\n--- Test 1d: Different customer accessing order ---")
    other_cookies, _ = customer_signup()
    if other_cookies:
        resp = requests.post(f"{BASE_URL}/payment/order",
            cookies=other_cookies,
            json={"orderId": order_id})
        print(f"Status: {resp.status_code}")
        if resp.status_code == 403:
            print("✅ TEST 1d PASSED: Different customer rejected (403)")
        else:
            print(f"❌ TEST 1d FAILED: Expected 403, got {resp.status_code}")
    else:
        print("⚠️  TEST 1d SKIPPED: Could not create second customer")
    
    # Test 1e will be done after payment verification (already paid order)
    print("\n--- Test 1e: Already paid order (will test after verification) ---")

def test_payment_verify(cookies, order_id, razorpay_order_id):
    """Test 2: POST /api/payment/verify - Verify payment signature"""
    print("\n" + "="*80)
    print("TEST 2: PAYMENT VERIFICATION")
    print("="*80)
    
    # Generate fake payment ID and compute valid signature
    razorpay_payment_id = f"pay_test{random.randint(1000000000, 9999999999)}"
    razorpay_signature = compute_signature(razorpay_order_id, razorpay_payment_id)
    
    print(f"\nGenerated test payment data:")
    print(f"  razorpay_order_id: {razorpay_order_id}")
    print(f"  razorpay_payment_id: {razorpay_payment_id}")
    print(f"  razorpay_signature: {razorpay_signature}")
    
    # Test 2a: Valid signature verification
    print("\n--- Test 2a: Valid signature verification ---")
    resp = requests.post(f"{BASE_URL}/payment/verify",
        cookies=cookies,
        json={
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get('verified') == True:
            print("✅ TEST 2a PASSED: Payment verified successfully")
            
            # Verify order is now paid
            print("\n--- Verifying order payment status ---")
            order_resp = requests.get(f"{BASE_URL}/orders/{order_id}", cookies=cookies)
            if order_resp.status_code == 200:
                order_data = order_resp.json().get('order', {})
                payment_status = order_data.get('paymentStatus')
                payment_ref = order_data.get('paymentReference')
                print(f"Order paymentStatus: {payment_status}")
                print(f"Order paymentReference: {payment_ref}")
                
                if payment_status == 'paid' and payment_ref == razorpay_payment_id:
                    print("✅ Order status updated correctly (paid)")
                else:
                    print(f"❌ Order status not updated correctly (expected paid/{razorpay_payment_id})")
            else:
                print(f"⚠️  Could not fetch order: {order_resp.status_code}")
        else:
            print("❌ TEST 2a FAILED: verified should be true")
    else:
        print(f"❌ TEST 2a FAILED: Expected 200, got {resp.status_code}")
        return False
    
    # Test 2b: Idempotency - verify again with same data
    print("\n--- Test 2b: Idempotency (verify again) ---")
    resp2 = requests.post(f"{BASE_URL}/payment/verify",
        cookies=cookies,
        json={
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
    print(f"Status: {resp2.status_code}")
    print(f"Response: {json.dumps(resp2.json(), indent=2)}")
    
    if resp2.status_code == 200:
        data2 = resp2.json()
        if data2.get('verified') == True and data2.get('alreadyProcessed') == True:
            print("✅ TEST 2b PASSED: Idempotency working (alreadyProcessed=true)")
        else:
            print("❌ TEST 2b FAILED: Should return alreadyProcessed=true")
    else:
        print(f"❌ TEST 2b FAILED: Expected 200, got {resp2.status_code}")
    
    return True

def test_payment_verify_invalid():
    """Test 2c-2e: Invalid verification scenarios"""
    print("\n" + "="*80)
    print("TEST 2c-2e: INVALID VERIFICATION SCENARIOS")
    print("="*80)
    
    # Setup: Create fresh order for invalid signature test
    cookies, user = customer_signup()
    if not cookies:
        print("❌ SETUP FAILED: Could not create customer")
        return
    
    products = get_products()
    if not products:
        print("❌ SETUP FAILED: No products available")
        return
    
    order = create_order(cookies, products[0]['id'])
    if not order:
        print("❌ SETUP FAILED: Could not create order")
        return
    
    # Create payment order
    resp = requests.post(f"{BASE_URL}/payment/order",
        cookies=cookies,
        json={"orderId": order['id']})
    
    if resp.status_code != 200:
        print("❌ SETUP FAILED: Could not create payment order")
        return
    
    razorpay_order_id = resp.json().get('orderId')
    razorpay_payment_id = f"pay_test{random.randint(1000000000, 9999999999)}"
    
    # Test 2c: Invalid signature
    print("\n--- Test 2c: Invalid signature ---")
    invalid_signature = "invalid_signature_12345678901234567890123456789012"
    resp = requests.post(f"{BASE_URL}/payment/verify",
        cookies=cookies,
        json={
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": invalid_signature
        })
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    
    if resp.status_code == 400 and 'signature' in resp.text.lower():
        print("✅ TEST 2c PASSED: Invalid signature rejected (400)")
        
        # Verify order is still unpaid
        order_resp = requests.get(f"{BASE_URL}/orders/{order['id']}", cookies=cookies)
        if order_resp.status_code == 200:
            payment_status = order_resp.json().get('order', {}).get('paymentStatus')
            if payment_status == 'pending':
                print("✅ Order remains unpaid after invalid signature")
            else:
                print(f"❌ Order status changed unexpectedly: {payment_status}")
    else:
        print(f"❌ TEST 2c FAILED: Expected 400 with signature error, got {resp.status_code}")
    
    # Test 2d: Incomplete body
    print("\n--- Test 2d: Incomplete body (missing fields) ---")
    resp = requests.post(f"{BASE_URL}/payment/verify",
        cookies=cookies,
        json={"razorpay_order_id": razorpay_order_id})
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    
    if resp.status_code == 400:
        print("✅ TEST 2d PASSED: Incomplete body rejected (400)")
    else:
        print(f"❌ TEST 2d FAILED: Expected 400, got {resp.status_code}")
    
    # Test 2e: Unknown razorpay_order_id
    print("\n--- Test 2e: Unknown razorpay_order_id ---")
    fake_order_id = "order_FakeOrderId123456"
    fake_payment_id = "pay_FakePaymentId123"
    fake_signature = compute_signature(fake_order_id, fake_payment_id)
    
    resp = requests.post(f"{BASE_URL}/payment/verify",
        cookies=cookies,
        json={
            "razorpay_order_id": fake_order_id,
            "razorpay_payment_id": fake_payment_id,
            "razorpay_signature": fake_signature
        })
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    
    if resp.status_code == 404:
        print("✅ TEST 2e PASSED: Unknown order rejected (404)")
    else:
        print(f"❌ TEST 2e FAILED: Expected 404, got {resp.status_code}")

def test_already_paid_order(cookies, order_id):
    """Test 1e: Already paid order should return 409"""
    print("\n" + "="*80)
    print("TEST 1e: ALREADY PAID ORDER")
    print("="*80)
    
    print("\n--- Test 1e: Create payment order for already paid order ---")
    resp = requests.post(f"{BASE_URL}/payment/order",
        cookies=cookies,
        json={"orderId": order_id})
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    
    if resp.status_code == 409:
        print("✅ TEST 1e PASSED: Already paid order rejected (409)")
    else:
        print(f"❌ TEST 1e FAILED: Expected 409, got {resp.status_code}")

def test_security_no_secret_leak():
    """Test 3: Ensure no secret leakage in responses"""
    print("\n" + "="*80)
    print("TEST 3: SECURITY - NO SECRET LEAKAGE")
    print("="*80)
    
    # Test various endpoints for secret leakage
    endpoints_to_check = [
        ("GET /products", "GET", "/products", None, None),
        ("GET /categories", "GET", "/categories", None, None),
    ]
    
    print(f"\nChecking for secret '{RAZORPAY_KEY_SECRET}' in responses...")
    
    leaked = False
    for name, method, path, cookies, json_data in endpoints_to_check:
        if method == "GET":
            resp = requests.get(f"{BASE_URL}{path}", cookies=cookies)
        else:
            resp = requests.post(f"{BASE_URL}{path}", cookies=cookies, json=json_data)
        
        if RAZORPAY_KEY_SECRET in resp.text:
            print(f"❌ SECRET LEAKED in {name}")
            leaked = True
    
    # Also check payment order response (already tested above but double-check)
    cookies, _ = customer_signup()
    if cookies:
        products = get_products()
        if products:
            order = create_order(cookies, products[0]['id'])
            if order:
                resp = requests.post(f"{BASE_URL}/payment/order",
                    cookies=cookies,
                    json={"orderId": order['id']})
                if RAZORPAY_KEY_SECRET in resp.text:
                    print(f"❌ SECRET LEAKED in POST /payment/order")
                    leaked = True
    
    if not leaked:
        print("✅ TEST 3 PASSED: No secret leakage detected in any endpoint")
    else:
        print("❌ TEST 3 FAILED: Secret leaked in one or more endpoints")

def main():
    """Run all Razorpay payment tests"""
    print("\n" + "="*80)
    print("RAZORPAY TEST MODE PAYMENT INTEGRATION TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Using Razorpay Test Secret: {RAZORPAY_KEY_SECRET[:4]}...{RAZORPAY_KEY_SECRET[-4:]}")
    
    try:
        # Test 1: Payment order creation and security
        cookies, order_id, razorpay_order_id = test_payment_order_creation()
        if cookies and order_id and razorpay_order_id:
            test_payment_order_security(order_id, razorpay_order_id, cookies)
            
            # Test 2: Payment verification
            verified = test_payment_verify(cookies, order_id, razorpay_order_id)
            
            # Test 1e: Already paid order (after verification)
            if verified:
                test_already_paid_order(cookies, order_id)
        
        # Test 2c-2e: Invalid verification scenarios
        test_payment_verify_invalid()
        
        # Test 3: Security - no secret leakage
        test_security_no_secret_leak()
        
        print("\n" + "="*80)
        print("ALL RAZORPAY TESTS COMPLETED")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED WITH EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
