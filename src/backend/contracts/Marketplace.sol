// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// interface is done so that we can call functions written in other solidity files
// interface of ERC721
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {

	// state variables
	// immutable - can take value only once
	// payable - the account can recieve the ether once nft is sold
	address payable public immutable feeAccount; // account that recieves the fees
	uint public immutable feePercent; // the fee percentage on sales
	uint public itemCount;

	 // IERC721 nft; instance of nft contract
	struct Item{
		uint itemId;
		IERC721 nft;
		uint tokenId;
		uint price;
		address payable seller;
		bool sold;
	}

	// event

	// address indexed nft: address of the nft contract
	// indexed: allows us to search for offerd events using nft and seller address as filters
	event Offered (
		uint itemId,
		address indexed nft,
		uint tokenId,
		uint price,
		address indexed seller
		);

	event Bought (
		uint itemId,
		address indexed nft,
		uint tokenId,
		uint price,
		address indexed seller,
		address indexed buyer
		);

	// to store items (mapping)
	// itemId -> Item
	// mapping stores the items as key - values
	mapping(uint => Item) public items;

	constructor(uint _feePercent) {
		feeAccount = payable(msg.sender);
		feePercent = _feePercent;

	}

	// function to make items in marketplace
	
	// passing nft contract and making it an instance of IERC721
	// in the frontend the user will be passing the address of the nft contract 
	// and the solidity will automatically turn it into an nft contract instance
	// nonReentrant prevents the contract from calling itself directly or indirectly
	function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
		
		// require is a control structure
		// condition evaluates to false, it will throw an exception, reverting any changes made to the state
		require(_price > 0, "Price must be grater than 0");
		
		// increment itemCount
		itemCount ++;

		// transfer nft
		// transferFrom(from: account calling the function, to: this contract, _tokenId: ID of the token passed to the function)
		_nft.transferFrom(msg.sender, address(this), _tokenId);

		// add the new item to items mapping
		items[itemCount] = Item (
			itemCount,
			_nft,
			_tokenId,
			_price,
			payable(msg.sender),
			false
			);
		// emit Offered event
		emit Offered(
			itemCount,
			address(_nft),
			_tokenId,
			_price,
			msg.sender
			);
	}

	// function to purchase items in marketplace

	function purchaseItem(uint _itemId) external payable nonReentrant{
		uint _totalPrice = getTotalPrice(_itemId);
		// get the item from the items mapping and store it the variable
		// item is directly reading from the structure mapping without creating any copy
		Item storage item = items[_itemId];
		require(_itemId > 0 && _itemId <= itemCount, "item does not exist");
		require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
		require(!item.sold, "item already sold!");

		// pay seller and fee account
		item.seller.transfer(item.price);
		feeAccount.transfer(_totalPrice - item.price);

		// update the item as sold
		item.sold = true;
		// transfer nft to buyer
		item.nft.transferFrom(address(this), msg.sender, item.tokenId);

		// emit Bought event
		emit Bought(
			_itemId,
			address(item.nft),
			item.tokenId,
			item.price,
			item.seller,
			msg.sender
			);
	}

	function getTotalPrice(uint _itemId) view public returns(uint) {
		return((items[_itemId].price*(100 + feePercent))/100);
	}
}