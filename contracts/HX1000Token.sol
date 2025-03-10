// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HX1000Token is ERC20, Ownable {
    // Constantes
    uint256 public constant INITIAL_SUPPLY = 21_000_000 * 10**18; // 21M tokens
    uint256 public constant TOKEN_PRICE_BRL = 238; // R$ 2.38 = 238/100

    // Evento para rastrear distribuições de tokens após pagamento PIX
    event TokensDistributed(address indexed to, uint256 amount, string pixReference);

    constructor() ERC20("HX1000 Token", "HX1000") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Função para distribuir tokens após confirmação do pagamento PIX
    function distributeTokens(address to, uint256 amount, string memory pixReference) public onlyOwner {
        require(balanceOf(owner()) >= amount, "Insufficient tokens");
        _transfer(owner(), to, amount);
        emit TokensDistributed(to, amount, pixReference);
    }
}