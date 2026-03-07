export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  title: string;
  items: FAQItem[];
}

export const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is ClearPath?",
        answer:
          "ClearPath is a personal finance management app that helps you track debts, manage expenses, plan budgets, and grow your savings — all in one place.",
      },
      {
        question: "Is ClearPath free to use?",
        answer:
          "Yes! ClearPath is completely free to use. No credit card required.",
      },
      {
        question: "How do I create an account?",
        answer:
          'Click "Create one" on the login page, enter your email, password, and display name. You\'ll receive a confirmation email to verify your account.',
      },
      {
        question: "Can I use ClearPath on my phone?",
        answer:
          "Yes, ClearPath is fully responsive and works great on mobile browsers. You can also add it to your home screen for an app-like experience.",
      },
    ],
  },
  {
    title: "Budget",
    items: [
      {
        question: "How does the Monthly Budget page work?",
        answer:
          "The Monthly Budget page shows all your debts, expenses, and extras for a given month alongside your income. You can check off items as you pay them and track your remaining budget in real time.",
      },
      {
        question: "What are budget extras?",
        answer:
          "Extras are one-time or irregular expenses you can add to a specific month's budget — things like gifts, repairs, or unexpected bills that aren't part of your regular expenses.",
      },
      {
        question: "Can I override my income for a specific month?",
        answer:
          "Yes! On the Monthly Budget page, click the edit icon next to your income to set a custom amount for that month. This won't change your default income in Settings.",
      },
      {
        question: "What does 'Skip Month' do?",
        answer:
          "Skipping a month marks it as pre-paid, meaning you've already handled all obligations outside the app. No balances are changed. You can unskip at any time.",
      },
    ],
  },
  {
    title: "Debts",
    items: [
      {
        question: "How do I add a new debt?",
        answer:
          'Go to the Debts page and click "Add Debt." Enter the name, type, balance, interest rate, and monthly payment. ClearPath will calculate your estimated payoff date.',
      },
      {
        question: "How is the payoff date calculated?",
        answer:
          "ClearPath uses amortization math — it iterates month by month, applying your interest rate and monthly payment to project when the balance reaches zero.",
      },
      {
        question: "Can I record payments on my debts?",
        answer:
          "Yes! On each debt's detail page, you can record monthly payments. These are also reflected on the Monthly Budget page as checked items.",
      },
    ],
  },
  {
    title: "Expenses",
    items: [
      {
        question: "What counts as an expense?",
        answer:
          "Expenses are your recurring monthly obligations like rent, utilities, subscriptions, insurance, groceries, and transportation costs.",
      },
      {
        question: "How do I track which expenses I've paid?",
        answer:
          "On the Monthly Budget page, each expense has a checkbox. Check it off when you've paid that expense for the month.",
      },
      {
        question: "Can I categorize my expenses?",
        answer:
          "Yes, each expense can be assigned a category like Utilities, Subscriptions, Insurance, Rent, Groceries, Transportation, Healthcare, or Other.",
      },
    ],
  },
  {
    title: "Savings",
    items: [
      {
        question: "How do savings goals work?",
        answer:
          "Create a savings goal with a name, target amount, and optional deadline. Then log monthly contributions to track your progress toward the goal.",
      },
      {
        question: "Can I have multiple savings goals?",
        answer:
          "Absolutely! You can create as many savings goals as you need and track them independently.",
      },
      {
        question: "How are savings projections calculated?",
        answer:
          "ClearPath projects your goal completion date based on your average monthly contribution rate. The more consistently you save, the more accurate the projection.",
      },
    ],
  },
  {
    title: "Account & Settings",
    items: [
      {
        question: "How do I change my display name?",
        answer:
          "Go to Settings → Profile and update your display name, then click Save Changes.",
      },
      {
        question: "Can I change my currency?",
        answer:
          "Yes! Go to Settings → Currency and select your preferred currency. All amounts across the app will be formatted accordingly.",
      },
      {
        question: "How do I export my data?",
        answer:
          "Go to Settings → Data Export and choose JSON or CSV format. This downloads all your debts, expenses, savings goals, and payment history.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to Settings → Account → Delete Account. This permanently removes all your data and cannot be undone.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Yes. ClearPath uses Supabase with Row Level Security (RLS), meaning your data is isolated to your account. No other user can access your financial information.",
      },
    ],
  },
];
