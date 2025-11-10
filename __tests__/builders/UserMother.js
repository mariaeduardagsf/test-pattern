/**
 * __tests__/builders/UserMother.js
 * Object Mother para criar instâncias comuns de usuários.
 */
const User = require("../../src/domain/User");

class UserMother {
  static umUsuarioPadrao() {
    return new User({
      id: "USR-001",
      nome: "Usuário Padrão",
      email: "user@dominio.com",
      tipo: "REGULAR"
    });
  }

  static umUsuarioPremium() {
    return new User({
      id: "USR-002",
      nome: "Usuário Premium",
      email: "premium@email.com",
      tipo: "PREMIUM"
    });
  }
}

module.exports = UserMother;