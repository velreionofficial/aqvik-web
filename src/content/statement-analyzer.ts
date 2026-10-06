import type { ToolFaq } from "@/content/tools";

/** Copy for the bank statement analyzer. Privacy is the headline promise; nothing here judges spending. */

export const statementTool = {
  slug: "bank-statement-analyzer",
  name: "Bank Statement Analyzer",
  cardLine: "A 60-second money review from your own bank or UPI statement: what came in, what went out, what you actually spent. The file never leaves your device.",
  title: "Bank Statement Analyzer — 60-Second Money Review | AQVIK",
  description:
    "Open your bank or UPI statement (CSV, Excel or PDF) and get a 60-second money review: money in, money out, actual spending, regular payments and what changed since last month. Runs in your browser; nothing is uploaded.",
  h1: "Bank statement analyzer",
  intro:
    "Open a statement from your bank or UPI app and get a 60-second money review: what came in, what went out, how much was actually spent, your regular payments, and what changed since last month. Your file is read on this device and is never uploaded.",
} as const;

export const statementCopy = {
  privacy: "Your file stays on this device. It is read in your browser and is never uploaded, saved or seen by AQVIK.",
  privacyHinglish: "Aapki file isi device par rehti hai. Browser mein hi padhi jaati hai, kahin upload ya save nahi hoti.",
  formats: "CSV, Excel (.xlsx and many bank .xls downloads) or PDF, up to 15 MB.",
  passwordHint:
    "Banks often lock statements with a password such as your date of birth or part of your mobile number, as explained in the bank's email. The password is used only on this device.",
  reasons: {
    password: "This PDF is protected. Enter its password to open it on this device.",
    "excel-password": "This Excel file is locked with a password. Enter it to open the file on this device.",
    "wrong-password": "That password did not open the file. Please check it and try again.",
    scanned: "This PDF looks like a scanned image, so there is no text to read. Download the statement as CSV, Excel or a regular PDF from net banking instead.",
    "locked-excel":
      "This locked Excel file uses a kind of protection we cannot open yet. Open it in Excel, WPS or LibreOffice with its password, save it as .xlsx without a password or as CSV, and pick that file here. Or download the PDF statement instead.",
    "old-xls": "This is an old Excel (.xls) file in a format we cannot read yet. Open it in Excel or Google Sheets and save it as .xlsx or CSV, or download CSV from net banking.",
    "too-big": "This file is larger than 15 MB. Please download a shorter period.",
    unreadable: "We could not read this file. Try the CSV or Excel download from your bank.",
    empty: "No rows were found in this file.",
  },
  noHeader:
    "We could not find the transaction table in this file. Choose the columns yourself below, or copy the problem report and send it to us so we can add this format.",
  reviewHelp: "Check that the dates, descriptions and amounts below look right. If a column is wrong, change it here.",
  guessNote: "Categories and payees are best guesses from each transaction's description. Change any category in the list below.",
  recurringNote: "Payments to the same payee for about the same amount at a steady interval (weekly, monthly, every 3 months or yearly). Next dates are estimates.",
  reviewNoCompare:
    "Save this review on this device. Next month, open your new statement here and AQVIK shows what changed: spending, income, debt, new or stopped regular payments.",
  reviewSaveNote:
    "Saving keeps only monthly totals, category totals and the names of your regular payments in this browser. Your statement, descriptions and account details are never saved, and nothing is sent to AQVIK. The calendar reminder is a file for your own calendar.",
  subsExplain:
    "Subscription-like spending includes every payment categorised as a subscription; detected recurring subscriptions are only those AQVIK found repeating with enough evidence.",
  subscriptionNote: "Services and memberships you pay for. Check each one is still something you want.",
  feesNote: "Charges taken by your bank or card company. You can ask your bank about any charge you don't recognise.",
  checkedOk: (n: number) =>
    `Checked: all ${n} balances add up. Every entry was read exactly, so the totals match your bank's statement.`,
  pdfRefused:
    "This bank PDF could not be read exactly, so we are not showing an analysis that might be wrong. Please download the statement as Excel or CSV from net banking and open that file here.",
  pdfRefusedHinglish: "Ye bank PDF bilkul sahi nahi padhi ja saki. Net banking se statement Excel ya CSV mein download karke yahan daalein.",
  mismatch: (bad: number, total: number) => `${bad} of ${total} balances do not add up.`,
  mismatchHelp: "Some rows may be missing or in the wrong column. Check the columns used below.",
  appNote:
    "UPI app statements have no balance column, so the totals cannot be cross-checked here. Compare them with the totals printed at the top of your statement.",
  tiles: {
    income: "Salary, regular income and payments from companies. Money from people is shown as transfers.",
    spending: "Payments to merchants and for bills, after linked refunds.",
    net: "Money in minus money out, as on your bank statement.",
    investments: "Purchases the statement itself shows, such as mutual fund SIPs or digital gold.",
    platforms: "Money sent to a broker or investment platform. This statement cannot confirm what was actually purchased.",
    debt: "EMIs, loans, credit card bills and pay-later.",
    cash: "Cash taken out. What it was spent on is not in the statement.",
    refunds: "Refunds linked to a payment reduce spending.",
    fees: "Bank charges, penalties and interest charged.",
  },
  unknownNote: (out: string, inn: string, low: number) =>
    `${out} out and ${inn} in could not be classified, and ${low} entries are low confidence. Filter the list below by "Needs review" to check them.`,
  editNote:
    "Change the type or category of any transaction and every total updates. Your choices stay on this device and are never sent anywhere.",
  multiNote: (dupes: number) =>
    dupes
      ? `${dupes} ${dupes === 1 ? "entry appears" : "entries appear"} in more than one statement and ${dupes === 1 ? "is" : "are"} counted once.`
      : "No entry appears in more than one statement, so nothing was counted twice.",
  addHint: "Have more months or another account? Add them and they are combined into one report; overlapping entries are counted once.",
  appCta: "Want to ask questions about your statement and track it every month? The AQVIK app is coming with this built in.",
  appCtaHinglish: "Statement se sawaal poochhna aur har mahine track karna? Ye AQVIK app mein aa raha hai.",
  reportHelp:
    "The problem report lists only the file's structure (column names, number of rows, date and amount shapes). It contains no names, amounts or descriptions.",
  exportNote:
    "Made with AQVIK's statement analyzer from a file read on the user's device. Categories and payees are best guesses. Not financial advice.",
  disclaimer:
    "For your own understanding only. Categories, payees and repeating payments are guessed from the transaction descriptions and may be wrong; your bank's statement is the official record. AQVIK does not connect to your bank and never sees your file. This is not financial advice.",
  cta: "Want this every month, kept up to date? Try AQVIK.",
};

export const statementFaqs: readonly ToolFaq[] = [
  {
    question: "Is it safe to open my bank statement here?",
    answer:
      "Your file is read by your own browser on your own device. It is not uploaded to AQVIK or anyone else, and nothing is saved after you close the page. You can even switch off the internet after the page loads and it still works.",
  },
  {
    question: "Which banks and apps does it work with?",
    answer:
      "It looks for the transaction table in any statement with a date column and amount columns, which covers the CSV, Excel and PDF downloads of most Indian banks and UPI apps. If yours is not read correctly, choose the columns yourself, or send us the problem report, which contains no personal details.",
  },
  {
    question: "Why is my PDF asking for a password?",
    answer:
      "Many banks protect statement PDFs. The password is usually explained in the email that came with the statement, for example your date of birth or part of your mobile number. It is used only on your device to open the file.",
  },
  {
    question: "Why is money out not the same as spending?",
    answer:
      "Money that leaves your account includes transfers to people or your own accounts, money sent to investment platforms, EMIs and card bills, and cash withdrawals. None of these is spending on goods or services, so the review shows actual spending separately.",
  },
  {
    question: "How does the month-to-month comparison work?",
    answer:
      "If your statement has two full months, the review compares them straight away. Otherwise, save the review on this device; next month, open your new statement here and it is compared with the saved month. Only monthly totals, category totals and the names of regular payments are saved, in your browser, and you can delete them at any time.",
  },
  {
    question: "How are categories decided?",
    answer:
      "From words in each transaction's description, such as SWIGGY for food or NACH and EMI for loans. They are best guesses; you can change any transaction's category and the totals update.",
  },
];
