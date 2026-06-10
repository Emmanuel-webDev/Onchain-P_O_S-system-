// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BasePOS - Serverless Point of Sale
 * @dev Uses event logs as primary data store for transaction history.
 *
 * Security applied: 
 *  1. Merchant address validated (non-zero, not contract itself, not customer)
 *  2. Max items cap to prevent gas-limit DoS
 *  3. Max individual price cap to prevent unreasonable charges
 *  4. Reentrancy guard (emit event before external call pattern + lock)
 *  5. Total overflow protection (explicit cap)
 *  6. Items/prices arrays validated for empty strings and zero prices
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract BasePOS {

    // ── Events ────────────────────────────────────────────────────────────────
    event PurchaseCompleted(
        address indexed merchant,
        address indexed customer,
        uint256 totalAmount,
        string[] items,
        uint256[] prices,
        uint256 timestamp,
        bool isUSDC
    );

    // ── Constants ─────────────────────────────────────────────────────────────

    // Base Sepolia USDC | Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    address public constant USDC_BASE = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    // Max items per transaction — prevents unbounded loop / gas DoS
    uint256 public constant MAX_ITEMS = 50;

    // Max price per item: 1,000,000 USDC (6 decimals) — sanity cap
    uint256 public constant MAX_ITEM_PRICE = 1_000_000 * 10 ** 6;

    // Max total per transaction: 1,000,000 USDC
    uint256 public constant MAX_TOTAL = 1_000_000 * 10 ** 6;

    // ── Reentrancy guard ──────────────────────────────────────────────────────
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() {
        _status = _NOT_ENTERED;
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    /**
     * @notice Process a USDC payment from customer to merchant.
     * @param _merchant  Merchant wallet address — validated on-chain
     * @param _items     Array of item names  e.g. ["Coffee", "Croissant"]
     * @param _prices    Array of prices in USDC atomic units (6 decimals)
     *                   e.g. [2_000_000, 3_000_000] = $2.00 + $3.00
     */
     
    function checkoutUSDC(
        address _merchant,
        string[] calldata _items,
        uint256[] calldata _prices
    ) external nonReentrant {

        // ── Merchant validation ───────────────────────────────────────────────
        require(_merchant != address(0),    "Invalid merchant: zero address");
        require(_merchant != address(this), "Invalid merchant: contract address");
        require(_merchant != msg.sender,    "Merchant and customer cannot be the same");

        // ── Array validation ──────────────────────────────────────────────────
        require(_items.length > 0,                      "No items provided");
        require(_items.length <= MAX_ITEMS,             "Too many items");
        require(_items.length == _prices.length,        "Items and prices length mismatch");

        // ── Sum total + validate each item ────────────────────────────────────
        uint256 total = 0;
        for (uint256 i = 0; i < _prices.length; i++) {
            require(_prices[i] > 0,                "Price must be greater than 0");
            require(_prices[i] <= MAX_ITEM_PRICE,  "Individual price exceeds maximum");
            require(bytes(_items[i]).length > 0,   "Item name cannot be empty");
            total += _prices[i];
        }

        require(total <= MAX_TOTAL, "Total exceeds maximum allowed");
        require(total > 0,         "Total must be greater than 0");

        // ── Emit BEFORE external call (reentrancy best practice) ─────────────
        // Even with the nonReentrant guard, emitting first is safer practice
        // and ensures the event is always recorded before any state change.
        emit PurchaseCompleted(
            _merchant,
            msg.sender,
            total,
            _items,
            _prices,
            block.timestamp,
            true
        );

        // ── Transfer USDC from customer → merchant ────────────────────────────
        bool success = IERC20(USDC_BASE).transferFrom(
            msg.sender,
            _merchant,
            total
        );
        require(success, "USDC transfer failed");
    }
}
