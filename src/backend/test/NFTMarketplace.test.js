// to automate the testing

// waffle framework for testing
// chai assertion library for comparing values

const { expect } = require("chai");

// 1 Ether = 10^18 Wei
const toWei	= (num) => ethers.utils.parseEther(num.toString())
const fromWei	= (num) => ethers.utils.formatEther(num)

// test
// describe("test_name",callback_function)
describe("NFTMarketplace", function(){
	// 1st addr- deployer,2nd addr- addr1, 3rd addr- addr2
	let deployer,addr1,addr2,nft,marketplace;
	let feePercent = 1;
	let URI = "sample URI";

	// eliminates the need to write the same code for each tests
	beforeEach(async function () {
		// get contract factory code for each contract
		const NFT = await ethers.getContractFactory("NFT");
		const Marketplace = await ethers.getContractFactory("Marketplace");

		// get signers(accounts in hardhat)
		[deployer,addr1,addr2] = await ethers.getSigners();

		// deployment of contract
		nft = await NFT.deploy();
		marketplace = await Marketplace.deploy(feePercent);
	});
	// test cases

	// to test if the contract was deployed properly
	describe("Deployment",function(){
		it("Should track name and symbol of the nft collection",async function(){
			expect(await nft.name()).to.equal("DApp NFT");
			expect(await nft.symbol()).to.equal("DAPP");
		})
		it("Should track feeAccount and feePercent of the marketplace",async function(){
			expect(await marketplace.feeAccount()).to.equal(deployer.address);
			expect(await marketplace.feePercent()).to.equal(feePercent);
		});
	})

	// to test if minting works
	describe("Minting NFTs",function(){
		it("Should track each minting nft",async function(){
			// addr1 mints an nft by connecting its account to the nft contract and use the mint functionality to pass URI of asset
			// nft.balanceOf() returns no.of NFTs owned by the specified account.
			await nft.connect(addr1).mint(URI);
			expect(await nft.tokenCount()).to.equal(1);
			expect(await nft.balanceOf(addr1.address)).to.equal(1);
			expect(await nft.tokenURI(1)).to.equal(URI);

			// addr2 mints an nft by connecting its account to the nft contract and use the mint functionality to pass URI of asset
			await nft.connect(addr2).mint(URI);
			expect(await nft.tokenCount()).to.equal(2);
			expect(await nft.balanceOf(addr2.address)).to.equal(1);
			expect(await nft.tokenURI(2)).to.equal(URI);
		})
	})

	// to test make items in marketplace
	describe("Making marketplace items",function(){
		beforeEach(async function() {
			// addr1 mints nft
			await nft.connect(addr1).mint(URI);
			// add1 approves marketplace to spend nft
			// setApprovalForAll: allows the owner of the NFT to approve another address to transfer their NFT on their behalf
			// inorder for the transferFrom() to work the seller should approve transfer their NFT by a remote buyer
			await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
		})

		// success case
		it("Should track newly created item,transfer nft from seller to the marketplace and emit Offered event", async function(){
			// addr1 offers its nft at a price of 1 ether
			// using wei because we can only use integer values in solidity
			await expect(marketplace.connect(addr1).makeItem(nft.address,1,toWei(1)))
			.to.emit(marketplace,"Offered")
			.withArgs(
				1,
				nft.address,
				1,
				toWei(1),
				addr1.address
				)
			// owner of nft should be marketplace
			expect(await nft.ownerOf(1)).to.equal(marketplace.address);
			// item count should be 1
			expect(await marketplace.itemCount()).to.equal(1);
			// get item from items mapping then check fields to ensure they are correct
			const item = await marketplace.items(1)
			expect(item.itemId).to.equal(1)
			expect(item.nft).to.equal(nft.address)
			expect(item.tokenId).to.equal(1)
			expect(item.price).to.equal(toWei(1))
			expect(item.sold).to.equal(false)
		});

		// fail case
		it("Should fail if price is set to zero", async function(){
			// addr1 offers its nft at a price of 0 ether
			// using wei because we can only use integer values in solidity
			// NOTE: message should be same as the contract
			await expect(marketplace.connect(addr1).makeItem(nft.address,1,0))
			.to.be.revertedWith("Price must be grater than 0");
		});

	});

	// to test purchase items in marketplace
	describe("Purchasing marketplace items", function () {
		let price = 2
		let fee = (feePercent / 100) * price
		let totalPriceInWei
		beforeEach(async function() {
			// addr1 mints nft
			await nft.connect(addr1).mint(URI);
			// add1 approves marketplace to spend nft
			// setApprovalForAll: allows the owner of the NFT to approve another address to transfer their NFT on their behalf
			// inorder for the transferFrom() to work the seller should approve transfer their NFT by a remote buyer
			await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
			// addr1 makes nft a marketplace item
			await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price))
		})

		// success case
		it("Should update item as sold, pay seller, transfer nft to buyer, charge fees and emit a Bought event", async function () {
			const sellerInitialEthBal = await addr1.getBalance();
			const feeAccountInitialEthBal = await deployer.getBalance();
			//console.log(feeAccountInitialEthBal)

			// fetch the total price of the item
			totalPriceInWei = await marketplace.getTotalPrice(1);

			// addr2 purchases the item
			// {value: totalPriceInWei} - 
			await expect(marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei}))
			.to.emit(marketplace, "Bought")
			.withArgs(
				1,
				nft.address,
				1,
				toWei(price),
				addr1.address,
				addr2.address
			)
			const sellerFinalEthBal = await addr1.getBalance()
			const feeAccountFinalEthBal = await deployer.getBalance()
			//console.log(feeAccountFinalEthBal)
			const fixVal = 0.000000000001

			// Item should be marked as sold
			expect((await marketplace.items(1)).sold).to.equal(true)

			// seller should receive payment for the price of the nft sold
			expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitialEthBal))

			// feeAccount should receive the fee
			expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal) - +fixVal)


			// buyer should own the nft
			expect(await nft.ownerOf(1)).to.equal(addr2.address);
		})

		it("Should fail for invalid item IDs, sold items and when not enough ether is paid", async function() {
			// fails for invalid IDs
			await expect(
				marketplace.connect(addr2).purchaseItem(2, {value: totalPriceInWei}))
			.to.be.revertedWith("item does not exist");
			await expect(
				marketplace.connect(addr2).purchaseItem(0, {value: totalPriceInWei}))
			.to.be.revertedWith("item does not exist");

			// fails when not enough ether is paid with the transaction
			await expect(
				marketplace.connect(addr2).purchaseItem(1, {value: toWei(price)}))
			.to.be.revertedWith("not enough ether to cover item price and market fee");

			// fails when tries to buy items that are already sold
			// addr2 purchases item 1
			await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
			// deployer tries to buy the sold item
			await expect(
				marketplace.connect(deployer).purchaseItem(1, {value: totalPriceInWei}))
			.to.be.revertedWith("item already sold!");
		})
	})
})