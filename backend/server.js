require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// Serve index.html from main project folder
app.use(express.static(path.join(__dirname, "..")));

// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "index.html")
    );
});

// ==========================================
// BACKEND TEST
// ==========================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "DealHunter AI backend is working!"
    });
});

// ==========================================
// DEALHUNTER AI SEARCH
// ==========================================

app.post("/api/search", async (req, res) => {

    try {

        // Get data from frontend
        const {
            product,
            budget,
            category
        } = req.body;

        console.log("");
        console.log("======================================");
        console.log("🔎 New DealHunter Search");
        console.log("Product:", product);
        console.log("Budget:", budget);
        console.log("Category:", category);
        console.log("======================================");

        // ======================================
        // VALIDATE PRODUCT
        // ======================================

        if (!product || product.trim() === "") {

            return res.status(400).json({
                success: false,
                error: "Please enter a product."
            });

        }

        // ======================================
        // CHECK API KEY
        // ======================================

        if (!process.env.ANAKIN_API_KEY) {

            return res.status(500).json({
                success: false,
                error:
                    "Anakin API key is missing. Please check your .env file."
            });

        }

        // ======================================
        // BUDGET
        // ======================================

        const maxBudget = budget
            ? Number(budget)
            : null;

        // ======================================
        // AI SEARCH PROMPT
        // ======================================

        const searchQuery = `

You are DealHunter AI, an autonomous shopping research agent.

USER REQUEST
-------------
Product: ${product}
Category: ${category || "Any"}
Maximum Budget: ₹${maxBudget || "No limit"}

YOUR JOB
--------

Search the CURRENT web and find the best products matching the user's request.

You must:

1. SEARCH
   Search the web for relevant products available in India.

2. READ
   Read product information, prices, specifications,
   ratings and useful details from the search results.

3. REASON
   Compare the products based on:
   - Price
   - Budget
   - Specifications
   - Features
   - Rating/reviews when available
   - Overall value for money

4. SELECT
   Select the best matching option.

IMPORTANT BUDGET RULE
---------------------

The maximum budget is ₹${maxBudget || "not specified"}.

${maxBudget
    ? `ONLY recommend products that are priced at or below ₹${maxBudget}.
DO NOT select products above ₹${maxBudget} as the best deal.
Avoid broad pages showing products outside the budget when possible.`
    : `There is no maximum budget. Find the best value options.`}

SEARCH REQUEST
--------------

Find current products for:

"${product}"

${maxBudget
    ? `Search specifically for "${product}" under ₹${maxBudget} in India.`
    : `Search specifically for "${product}" in India.`}

PREFER
------

- Current product pages
- Indian shopping websites
- Actual product listings
- Current prices
- Relevant specifications
- Ratings/reviews when available

AVOID
-----

- Irrelevant products
- Very broad category pages
- News articles
- Old/outdated pages
- Products clearly above the user's budget

Find up to 8 useful search results.

Return the most relevant current product pages.
`;

        // ======================================
        // CALL ANAKIN SEARCH API
        // ======================================

        console.log("🤖 Sending request to Anakin...");

        const response = await fetch(
            "https://api.anakin.io/v1/search",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.ANAKIN_API_KEY
                },

                // IMPORTANT:
                // Anakin expects "prompt", NOT "query"
                body: JSON.stringify({
                    prompt: searchQuery,
                    limit: 8
                })
            }
        );

        // ======================================
        // GET ANAKIN RESPONSE
        // ======================================

        const data = await response.json();

        console.log(
            "Anakin response status:",
            response.status
        );

        // ======================================
        // HANDLE API ERROR
        // ======================================

        if (!response.ok) {

            console.error(
                "❌ Anakin API Error:",
                data
            );

            return res.status(response.status).json({
                success: false,
                error:
                    data?.message ||
                    "Anakin API request failed.",
                details: data
            });

        }

        console.log("✅ Anakin search completed");

        // ======================================
        // GET SEARCH RESULTS
        // ======================================

        const results = Array.isArray(data.results)
            ? data.results
            : [];

        console.log(
            "📦 Results received:",
            results.length
        );

        // ======================================
        // SEND RESULTS TO FRONTEND
        // ======================================

        return res.json({

            success: true,

            product: product,

            budget: maxBudget,

            category:
                category || "Any",

            results: results

        });

    }

    catch (error) {

        console.error(
            "❌ Server Error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Something went wrong while searching.",

            details:
                error.message

        });

    }

});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("      🚀 DealHunter AI");
    console.log("======================================");
    console.log(
        `🌐 http://localhost:${PORT}`
    );
    console.log("======================================");
    console.log("");

});