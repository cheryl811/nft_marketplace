// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";




//is ERC721URIStorage inherit all the functions of ERC721 to NFT contract
contract NFT is ERC721URIStorage {
    // state varibles are variables declared outside all functions inside the contract
    // only functions within the contract can modify the state variables
    // state variables are stored to the blockchain. whenever the state variable is modified state of blockchain is modified
    // so it cost gas to call functions

    // state variable to keep track of the no. of NFT tokens, public is used to read the var outside the contract
    uint public tokenCount;

    // solidity initialized the variables with the default value of the data type
    // default value of uint(unsigned integer) is 0. so no need to initialze tokenCount

    // constructor function is a function that is called only once when the contract is deployed to the blockchain

    //constructor function
    // no statements
    // ERC721("DApp NFT","DAPP") imports the basic NFT 
    // "DApp NFT" is the name of nft and "DAPP" is the value 
    constructor() ERC721("DApp NFT","DAPP") {}

    // fuction to mint new NFT
    // _tokenURI stores the ipfs id created for the item
    // to pass strings to function you need to specify the memory location of the arrgument
    // we want the function to be called from outside
    // visiblity of function : external
    // the function returns ID of the newly created nft which is stored in tokenCount
    // tokenCount will be the id(internal) of the new nft created
    function mint(string memory _tokenURI) external returns(uint){
        tokenCount ++;
        // function in the ERC721 to mint a new nft
        // msg.sender address of the sender who is minting the item
        // tokenCount=tokenID
        _safeMint(msg.sender, tokenCount);
        // // function in the ERC721 to set meta data(ipfs ID) to the nft
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }
}