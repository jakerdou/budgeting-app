import os
import sys
from dotenv import load_dotenv
from collections import defaultdict
import json
import datetime

# Change to the backend directory so the relative paths work correctly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(backend_dir)

# Add the current directory to Python path
sys.path.insert(0, os.getcwd())

# Now import the database connection
from api.db import db

# Load environment variables
load_dotenv()

def custom_serializer(obj):
    """Custom serializer for datetime objects"""
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def get_all_users():
    """Get all users from the database"""
    users_query = db.collection("users")
    users_docs = users_query.stream()
    
    users = []
    for doc in users_docs:
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        users.append(user_data)
    
    return users

def get_categories_for_user(user_id):
    """Get all categories for a specific user"""
    categories_query = db.collection("categories").where("user_id", "==", user_id)
    categories_docs = categories_query.stream()
    
    categories = {}
    for doc in categories_docs:
        category_data = doc.to_dict()
        category_data['id'] = doc.id
        categories[doc.id] = category_data
    
    return categories

def get_transactions_for_user(user_id):
    """Get all transactions for a specific user"""
    transactions_query = db.collection("transactions").where("user_id", "==", user_id)
    transactions_docs = transactions_query.stream()
    
    transactions = []
    for doc in transactions_docs:
        transaction_data = doc.to_dict()
        transaction_data['id'] = doc.id
        transactions.append(transaction_data)
    
    return transactions

def get_assignments_for_user(user_id):
    """Get all assignments for a specific user"""
    assignments_query = db.collection("assignments").where("user_id", "==", user_id)
    assignments_docs = assignments_query.stream()
    
    assignments = []
    for doc in assignments_docs:
        assignment_data = doc.to_dict()
        assignment_data['id'] = doc.id
        assignments.append(assignment_data)
    
    return assignments

def calculate_expected_available(category_id, transactions, assignments, is_unallocated_funds=False):
    """
    Calculate what the available amount should be for a category based on transactions and assignments.
    
    For regular categories:
    Available = Sum of assignments TO the category + Sum of transaction amounts FOR the category
    
    For unallocated funds category:
    Available = Sum of transaction amounts FOR unallocated funds - Sum of ALL assignments for the user
    
    This reflects that unallocated funds:
    - Receive money from transactions (income goes to unallocated first)
    - Lose money when assignments are made to other categories
    - Do NOT receive direct assignments (money is assigned FROM unallocated TO other categories)
    
    Note: Transaction amounts are stored as negative for expenses and positive for income.
    Assignment amounts are always positive (money being allocated TO a category).
    """
    
    if is_unallocated_funds:
        # For unallocated funds: transactions assigned to it minus all assignments
        total_transactions = 0.0
        for transaction in transactions:
            if transaction.get('category_id') == category_id:
                total_transactions += transaction.get('amount', 0.0)
        
        # Sum ALL assignments for the user (regardless of category)
        total_all_assignments = 0.0
        for assignment in assignments:
            total_all_assignments += assignment.get('amount', 0.0)
        
        # Unallocated available = transactions to unallocated - all assignments
        expected_available = total_transactions - total_all_assignments
        
        return expected_available, 0.0, total_transactions, total_all_assignments
    else:
        # Regular category logic
        # Sum all assignments TO this category
        total_assignments = 0.0
        for assignment in assignments:
            if assignment.get('category_id') == category_id:
                total_assignments += assignment.get('amount', 0.0)
        
        # Sum all transaction amounts FOR this category
        total_transactions = 0.0
        for transaction in transactions:
            if transaction.get('category_id') == category_id:
                total_transactions += transaction.get('amount', 0.0)
        
        # Available = Assignments + Transactions
        # (Assignments add money, negative transactions subtract money, positive transactions add money)
        expected_available = total_assignments + total_transactions
        
        return expected_available, total_assignments, total_transactions

def validate_database_integrity():
    """
    Main function to validate database integrity.
    Checks that all category available amounts match the calculated values from transactions and assignments.
    """
    
    print("Starting database integrity validation...")
    print("=" * 60)
    
    # Get all users
    users = get_all_users()
    print(f"Found {len(users)} users in the database")
    
    all_issues = []
    summary_stats = {
        'total_users': len(users),
        'total_categories_checked': 0,
        'categories_with_issues': 0,
        'total_discrepancy_amount': 0.0
    }
    
    # Check each user's data
    for user in users:
        user_id = user['id']
        user_email = user.get('email', 'No email')
        
        print(f"\n--- Checking User: {user_email} (ID: {user_id}) ---")
        
        # Get user's categories, transactions, and assignments
        categories = get_categories_for_user(user_id)
        transactions = get_transactions_for_user(user_id)
        assignments = get_assignments_for_user(user_id)
        
        print(f"  Categories: {len(categories)}")
        print(f"  Transactions: {len(transactions)}")
        print(f"  Assignments: {len(assignments)}")
        
        user_issues = []
        
        # Check each category
        for category_id, category_data in categories.items():
            summary_stats['total_categories_checked'] += 1
            
            category_name = category_data.get('name', 'Unknown')
            stored_available = category_data.get('available', 0.0)
            is_unallocated = category_data.get('is_unallocated_funds', False)
            
            # Calculate expected available amount
            if is_unallocated:
                expected_available, total_assignments, total_transactions, total_all_assignments = calculate_expected_available(
                    category_id, transactions, assignments, is_unallocated_funds=True
                )
            else:
                expected_available, total_assignments, total_transactions = calculate_expected_available(
                    category_id, transactions, assignments, is_unallocated_funds=False
                )
                total_all_assignments = None  # Not applicable for regular categories
            
            # Check for discrepancy
            discrepancy = abs(stored_available - expected_available)
            tolerance = 0.01  # Allow for small floating point differences
            
            if discrepancy > tolerance:
                issue = {
                    'user_id': user_id,
                    'user_email': user_email,
                    'category_id': category_id,
                    'category_name': category_name,
                    'is_unallocated_funds': is_unallocated,
                    'stored_available': stored_available,
                    'expected_available': expected_available,
                    'discrepancy': discrepancy,
                    'total_assignments': total_assignments,
                    'total_transactions': total_transactions
                }
                
                # Add total_all_assignments for unallocated funds
                if is_unallocated:
                    issue['total_all_assignments'] = total_all_assignments
                
                user_issues.append(issue)
                all_issues.append(issue)
                summary_stats['categories_with_issues'] += 1
                summary_stats['total_discrepancy_amount'] += discrepancy
                
                print(f"    ❌ ISSUE: {category_name} (ID: {category_id})")
                print(f"       Stored Available: ${stored_available:.2f}")
                print(f"       Expected Available: ${expected_available:.2f}")
                print(f"       Discrepancy: ${discrepancy:.2f}")
                if is_unallocated:
                    print(f"       (Transactions to Unallocated: ${total_transactions:.2f}, Total User Assignments: ${total_all_assignments:.2f})")
                else:
                    print(f"       (Assignments: ${total_assignments:.2f}, Transactions: ${total_transactions:.2f})")
            else:
                print(f"    ✅ OK: {category_name} (ID: {category_id}) - ${stored_available:.2f}")
        
        if not user_issues:
            print(f"  ✅ All categories for {user_email} are correct!")
    
    # Print summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Total Users: {summary_stats['total_users']}")
    print(f"Total Categories Checked: {summary_stats['total_categories_checked']}")
    print(f"Categories with Issues: {summary_stats['categories_with_issues']}")
    print(f"Total Discrepancy Amount: ${summary_stats['total_discrepancy_amount']:.2f}")
    
    if all_issues:
        print(f"\n❌ Found {len(all_issues)} categories with availability discrepancies!")
        print("\nDETAILED ISSUES:")
        print("-" * 40)
        
        for issue in all_issues:
            print(f"User: {issue['user_email']}")
            print(f"Category: {issue['category_name']} (ID: {issue['category_id']}) ({'Unallocated Funds' if issue['is_unallocated_funds'] else 'Regular Category'})")
            print(f"Stored: ${issue['stored_available']:.2f} | Expected: ${issue['expected_available']:.2f} | Diff: ${issue['discrepancy']:.2f}")
            
            if issue['is_unallocated_funds']:
                print(f"Breakdown - Transactions to Unallocated: ${issue['total_transactions']:.2f}, Total User Assignments: ${issue.get('total_all_assignments', 0.0):.2f}")
            else:
                print(f"Breakdown - Assignments: ${issue['total_assignments']:.2f}, Transactions: ${issue['total_transactions']:.2f}")
            print("-" * 40)
    else:
        print("\n✅ All category available amounts are correct!")
    
    # Save detailed results to JSON file with timestamp in db_validations folder
    timestamp = datetime.datetime.now()
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    
    # Create db_validations directory if it doesn't exist
    validations_dir = 'db_validations'
    os.makedirs(validations_dir, exist_ok=True)
    
    filename = f'db_validation_results_{timestamp_str}.json'
    filepath = os.path.join(validations_dir, filename)
    
    results = {
        'validation_timestamp': timestamp.isoformat(),
        'summary': summary_stats,
        'issues': all_issues
    }
    
    with open(filepath, 'w') as json_file:
        json.dump(results, json_file, indent=4, default=custom_serializer)
    
    print(f"\nDetailed results saved to: {filepath}")
    
    return len(all_issues) == 0

def get_transaction_details_for_category(category_id, transactions):
    """Get detailed breakdown of transactions for a specific category"""
    category_transactions = [t for t in transactions if t.get('category_id') == category_id]
    
    print(f"\nTransaction details for category {category_id}:")
    total = 0.0
    for transaction in category_transactions:
        amount = transaction.get('amount', 0.0)
        name = transaction.get('name', 'Unknown')
        date = transaction.get('date', 'Unknown')
        total += amount
        print(f"  {date}: {name} - ${amount:.2f}")
    
    print(f"Total transaction amount: ${total:.2f}")
    return total

def get_assignment_details_for_category(category_id, assignments):
    """Get detailed breakdown of assignments for a specific category"""
    category_assignments = [a for a in assignments if a.get('category_id') == category_id]
    
    print(f"\nAssignment details for category {category_id}:")
    total = 0.0
    for assignment in category_assignments:
        amount = assignment.get('amount', 0.0)
        date = assignment.get('date', 'Unknown')
        total += amount
        print(f"  {date}: Assignment - ${amount:.2f}")
    
    print(f"Total assignment amount: ${total:.2f}")
    return total

def get_all_assignment_details_for_user(assignments):
    """Get detailed breakdown of ALL assignments for a user (useful for unallocated funds debugging)"""
    print(f"\nAll assignment details for user:")
    total = 0.0
    for assignment in assignments:
        amount = assignment.get('amount', 0.0)
        date = assignment.get('date', 'Unknown')
        category_id = assignment.get('category_id', 'Unknown')
        total += amount
        print(f"  {date}: Assignment to {category_id} - ${amount:.2f}")
    
    print(f"Total ALL assignments amount: ${total:.2f}")
    return total

if __name__ == "__main__":
    try:
        # Run the validation
        is_valid = validate_database_integrity()
        
        if is_valid:
            print("\n🎉 Database integrity check PASSED!")
            exit(0)
        else:
            print("\n⚠️  Database integrity check FAILED!")
            exit(1)
            
    except Exception as e:
        print(f"\n❌ Error during validation: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
