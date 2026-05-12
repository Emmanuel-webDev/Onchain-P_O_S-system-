// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BasePOS - Serverless Point of Sale
 * @dev Uses event logs as a primary data store for transaction history.
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract BasePOS {
    event PurchaseCompleted(
        address indexed merchant,
        address indexed customer,
        uint256 totalAmount,
        string[] items,
        uint256[] prices,
        uint256 timestamp,
        bool isUSDC
    );

    // Base Sepolia USDC | Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    address public constant USDC_BASE = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    /**
     * @notice Handles USDC payments.
     * @dev Customer must 'Approve' this contract to spend USDC first.
     * @param _merchant  Merchant wallet address
     * @param _items     Array of item names  e.g. ["Black Tea", "Croissant"]
     * @param _prices    Array of prices in USDC (6 decimals) e.g. [2000000, 3000000]
     */
    function checkoutUSDC(
        address _merchant,
        string[] calldata _items,
        uint256[] calldata _prices
    ) external {
        require(_items.length > 0, "No items");
        require(_items.length == _prices.length, "Items and prices length mismatch");

        // Sum up total from prices array
        uint256 total = 0;
        for (uint256 i = 0; i < _prices.length; i++) {
            require(_prices[i] > 0, "Price must be > 0");
            total += _prices[i];
        }

        // Transfer total USDC from customer to merchant
        bool success = IERC20(USDC_BASE).transferFrom(msg.sender, _merchant, total);
        require(success, "USDC transfer failed");

        emit PurchaseCompleted(_merchant, msg.sender, total, _items, _prices, block.timestamp, true);
    }
}