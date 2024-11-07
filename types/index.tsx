export type Category = {
    id: string;
    name: string;
    allocated: number;
    available: number;
};

export type Transaction = {
    id: string;
    amount: number;
    category_id: string;
    date: string
    name: string;
    type: string;
    user_id: string;
};