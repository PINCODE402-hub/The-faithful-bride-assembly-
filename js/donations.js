import { db } from './app.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const presetButtons = document.querySelectorAll('.amt-btn');
const customAmountInput = document.getElementById('custom-amount');
const giftFundSelect = document.getElementById('gift-fund');

const payMomoBtn = document.getElementById('pay-momo');
const payPaypalBtn = document.getElementById('pay-paypal');

// Make sure this is globally mutable
let selectedAmount = 100; 

// --- PRESET CLICK CONTROLLERS ---
presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        presetButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedAmount = parseFloat(e.target.dataset.amount);
        customAmountInput.value = selectedAmount;
    });
});

customAmountInput.addEventListener('input', (e) => {
    selectedAmount = parseFloat(e.target.value) || 0;
    presetButtons.forEach(b => {
        if (parseFloat(b.dataset.amount) !== selectedAmount) b.classList.remove('active');
    });
});

// --- MOBILE MONEY TRANSACTION HANDLER ---
async function payWithMobileMoney() {
    const chosenFund = giftFundSelect.value;

    if (selectedAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Ask for email (Paystack requires an email address to route receipts)
    const userEmail = prompt("Please enter your email address to receive your payment receipt:") || "info@faithchurch.org";

    try {
        // 1. Log giving intent to your Firebase Database
        await addDoc(collection(db, "giving_intents"), {
            fund: chosenFund,
            amount: selectedAmount,
            processor: "Paystack MoMo",
            email: userEmail,
            timestamp: serverTimestamp()
        });

        // 2. Open Paystack Checkout
        let handler = PaystackPop.setup({
            // Your current testing key
            key: 'pk_test_809f8320977f896c7b0355878ab9cc64720554d2', 
            email: userEmail,
            amount: Math.round(selectedAmount * 100), // Wrapped in Math.round to prevent float-point math bugs
            currency: 'GHS', 
            channels: ['mobile_money', 'card'], 
            metadata: {
                custom_fields: [
                    {
                        display_name: "Ministry Fund",
                        variable_name: "ministry_fund",
                        value: chosenFund
                    }
                ]
            },
            callback: function(response) {
                // This will execute as soon as you hit "Simulate Success"
                alert('Thank you! Payment successful. Reference: ' + response.reference);
                window.location.href = "index.html"; 
            },
            onClose: function() {
                alert('Transaction window closed before completion.');
            }
        });

        handler.openIframe();

    } catch (err) {
        console.error("Giving record transaction failure: ", err);
        alert("Could not initialize MoMo gateway. Ensure your browser console has no errors.");
    }
}

// --- PAYPAL ROUTING FALLBACK ---
function payWithPaypal() {
    const chosenFund = giftFundSelect.value;
    const paypalBusinessEmail = "your-church-paypal@email.com";
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodeURIComponent(paypalBusinessEmail)}&item_name=${encodeURIComponent('Faith Church: ' + chosenFund)}&amount=${selectedAmount}&currency_code=USD`;
    window.location.href = paypalUrl;
}

// Event Listeners
if(payMomoBtn) payMomoBtn.addEventListener('click', payWithMobileMoney);
if(payPaypalBtn) payPaypalBtn.addEventListener('click', payWithPaypal);