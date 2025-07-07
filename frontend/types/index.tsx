export type Category = {
    id: string;
    name: string;
    allocated: number;
    available: number;
    goal_amount?: number;
};

export type Transaction = {
    id: string;
    amount: number;
    category_id: string | null;
    date: string
    name: string;
    type: string;
    user_id: string;
    account_name: string;
};

type Account = {
    account_id: string;
    name: string;
    type: string;
}

// Type definition for Plaid items
export type PlaidItem = {
    id: string; // Assuming 'id' is mapped to 'account_id'
    access_token: string; // Assuming 'access_token' is a string
    accounts: Account[]; // Assuming 'accounts' is an array of Account objects
    created_at: Date; // Timestamp as a string
    cursor: string;
    institution_name: string;
    user_id: string;
};