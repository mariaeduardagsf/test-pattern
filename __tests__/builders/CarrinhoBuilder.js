/**
 * __tests__/builders/CarrinhoBuilder.js
 * Data Builder para Carrinho com API fluente e valores padrão.
 */
const Carrinho = require("../../src/domain/Carrinho");
const Item = require("../../src/domain/Item");
const UserMother = require("./UserMother");

class CarrinhoBuilder {
  constructor() {
    // Valores padrão razoáveis
    this._user = UserMother.umUsuarioPadrao();
    this._itens = [ new Item("SKU-DEFAULT", "Item Padrão", 50, 1) ];
  }

  comUser(user) {
    this._user = user;
    return this;
  }

  comItens(itens) {
    this._itens = itens;
    return this;
  }

  vazio() {
    this._itens = [];
    return this;
  }

  build() {
    return new Carrinho(this._user, this._itens);
  }
}

module.exports = { CarrinhoBuilder };