import requests
import sys
import json
from datetime import datetime

class GsPremierFitFanAPITester:
    def __init__(self, base_url="https://kit-masters-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.product_id = None
        self.order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "+2348012345678"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing user"""
        login_data = {
            "email": "testuser@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login (if exists)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@gspremierfitfan.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin logged in successfully")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_products(self):
        """Test get products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        
        if success and 'products' in response and len(response['products']) > 0:
            self.product_id = response['products'][0]['id']
            print(f"   Found {len(response['products'])} products")
            print(f"   First product ID: {self.product_id}")
            return True
        return success

    def test_get_featured_products(self):
        """Test get featured products"""
        success, response = self.run_test(
            "Get Featured Products",
            "GET",
            "products?featured=true",
            200
        )
        return success

    def test_get_product_by_id(self):
        """Test get single product"""
        if not self.product_id:
            print("❌ No product ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Product by ID",
            "GET",
            f"products/{self.product_id}",
            200
        )
        return success

    def test_get_categories(self):
        """Test get categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success

    def test_get_sports(self):
        """Test get sports"""
        success, response = self.run_test(
            "Get Sports",
            "GET",
            "sports",
            200
        )
        return success

    def test_get_collections(self):
        """Test get collections"""
        success, response = self.run_test(
            "Get Collections",
            "GET",
            "collections",
            200
        )
        return success

    def test_add_to_cart(self):
        """Test add to cart"""
        if not self.product_id:
            print("❌ No product ID available for cart testing")
            return False
            
        cart_data = {
            "product_id": self.product_id,
            "quantity": 2,
            "size": "M",
            "color": "Black"
        }
        
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart/add",
            200,
            data=cart_data
        )
        return success

    def test_get_cart(self):
        """Test get cart"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        return success

    def test_add_to_wishlist(self):
        """Test add to wishlist"""
        if not self.product_id:
            print("❌ No product ID available for wishlist testing")
            return False
            
        success, response = self.run_test(
            "Add to Wishlist",
            "POST",
            f"wishlist/{self.product_id}",
            200
        )
        return success

    def test_get_wishlist(self):
        """Test get wishlist"""
        success, response = self.run_test(
            "Get Wishlist",
            "GET",
            "wishlist",
            200
        )
        return success

    def test_create_order(self):
        """Test create order"""
        if not self.product_id:
            print("❌ No product ID available for order testing")
            return False
            
        order_data = {
            "shipping_address": {
                "full_name": "Test User",
                "address": "123 Test Street",
                "city": "Lagos",
                "state": "Lagos",
                "country": "Nigeria",
                "phone": "+2348012345678",
                "email": "test@example.com"
            },
            "payment_method": "paystack",
            "items": [
                {
                    "product_id": self.product_id,
                    "quantity": 1,
                    "size": "M",
                    "color": "Black"
                }
            ],
            "notes": "Test order"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'order_id' in response:
            self.order_id = response['order_id']
            print(f"   Order ID: {self.order_id}")
            return True
        return success

    def test_get_orders(self):
        """Test get user orders"""
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        return success

    def test_get_payment_methods(self):
        """Test get payment methods"""
        success, response = self.run_test(
            "Get Payment Methods",
            "GET",
            "payment-methods",
            200
        )
        return success

    def test_get_crypto_rates(self):
        """Test get crypto rates"""
        success, response = self.run_test(
            "Get Crypto Rates",
            "GET",
            "crypto/rates",
            200
        )
        return success

    # Admin Tests
    def test_admin_analytics(self):
        """Test admin analytics"""
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            use_admin=True
        )
        return success

    def test_admin_get_orders(self):
        """Test admin get orders"""
        success, response = self.run_test(
            "Admin Get Orders",
            "GET",
            "admin/orders",
            200,
            use_admin=True
        )
        return success

    def test_admin_get_customers(self):
        """Test admin get customers"""
        success, response = self.run_test(
            "Admin Get Customers",
            "GET",
            "admin/customers",
            200,
            use_admin=True
        )
        return success

    def test_admin_create_product(self):
        """Test admin create product"""
        product_data = {
            "name": "Test Product",
            "description": "A test product for API testing",
            "price": 25000,
            "compare_price": 30000,
            "category": "jerseys",
            "sport": "Football",
            "sizes": ["S", "M", "L"],
            "colors": ["Black", "White"],
            "images": ["https://via.placeholder.com/600"],
            "stock": 50,
            "featured": False,
            "collection": "Test Collection"
        }
        
        success, response = self.run_test(
            "Admin Create Product",
            "POST",
            "admin/products",
            200,
            data=product_data,
            use_admin=True
        )
        return success

    def test_admin_theme_settings(self):
        """Test admin theme settings"""
        # Get theme settings
        success1, response = self.run_test(
            "Admin Get Theme Settings",
            "GET",
            "admin/settings/theme",
            200,
            use_admin=True
        )
        
        # Update theme settings
        theme_data = {
            "primary_color": "#050505",
            "accent_color": "#CCFF00",
            "secondary_color": "#FFFFFF"
        }
        
        success2, response = self.run_test(
            "Admin Update Theme Settings",
            "PUT",
            "admin/settings/theme",
            200,
            data=theme_data,
            use_admin=True
        )
        
        return success1 and success2

def main():
    print("🚀 Starting Gs Premier Fit Fan API Tests")
    print("=" * 50)
    
    tester = GsPremierFitFanAPITester()
    
    # Test sequence
    tests = [
        # Basic setup
        ("Seed Data", tester.test_seed_data),
        
        # Authentication tests
        ("User Registration", tester.test_user_registration),
        ("User Login", tester.test_user_login),
        ("Admin Login", tester.test_admin_login),
        ("Get Current User", tester.test_get_me),
        
        # Product tests
        ("Get Products", tester.test_get_products),
        ("Get Featured Products", tester.test_featured_products),
        ("Get Product by ID", tester.test_get_product_by_id),
        ("Get Categories", tester.test_categories),
        ("Get Sports", tester.test_sports),
        ("Get Collections", tester.test_collections),
        
        # Cart and Wishlist tests
        ("Add to Cart", tester.test_add_to_cart),
        ("Get Cart", tester.test_get_cart),
        ("Add to Wishlist", tester.test_add_to_wishlist),
        ("Get Wishlist", tester.test_get_wishlist),
        
        # Order tests
        ("Create Order", tester.test_create_order),
        ("Get Orders", tester.test_get_orders),
        
        # Payment tests
        ("Get Payment Methods", tester.test_get_payment_methods),
        ("Get Crypto Rates", tester.test_get_crypto_rates),
        
        # Admin tests
        ("Admin Analytics", tester.test_admin_analytics),
        ("Admin Get Orders", tester.test_admin_get_orders),
        ("Admin Get Customers", tester.test_admin_get_customers),
        ("Admin Create Product", tester.test_admin_create_product),
        ("Admin Theme Settings", tester.test_admin_theme_settings),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())