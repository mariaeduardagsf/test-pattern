/**
 * __tests__/CheckoutService.test.js
 * Suíte de testes demonstrando uso de Object Mother, Data Builder, Stub e Mock.
 * Obs.: Ajuste os imports conforme sua estrutura real de pastas do projeto.
 * Este arquivo assume que o CheckoutService recebe dependências no construtor.
 */
const CheckoutService = require("../src/services/CheckoutService");
const Carrinho = require("../src/domain/Carrinho");
const Item = require("../src/domain/Item");
const Pedido = require("../src/domain/Pedido");
const UserMother = require("./builders/UserMother");
const { CarrinhoBuilder } = require("./builders/CarrinhoBuilder");

describe("CheckoutService", () => {
  describe("quando o pagamento falha", () => {
    test("deve retornar null (verificação de estado) e não acionar outras dependências", async () => {
      // Arrange
      const user = UserMother.umUsuarioPadrao();
      const carrinho = new CarrinhoBuilder().comUser(user).comItens([
        new Item("SKU-01", "Mouse", 100, 1),
      ]).build();

      // STUB: gateway retorna sucesso=false controlando o fluxo do teste
      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };

      // DUMMIES: não devem ser chamados neste cenário de falha
      const pedidoRepositoryDummy = {
        salvar: jest.fn(() => { throw new Error("Não deveria salvar em falha"); })
      };
      const emailServiceDummy = {
        enviarEmail: jest.fn(() => { throw new Error("Não deveria enviar e-mail"); })
      };

      const checkoutService = new CheckoutService(gatewayStub, emailServiceDummy, pedidoRepositoryDummy);

      // Act
      const pedido = await checkoutService.processarPedido(carrinho);

      // Assert (State Verification)
      expect(pedido).toBeNull();
      expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
      expect(pedidoRepositoryDummy.salvar).not.toHaveBeenCalled();
      expect(emailServiceDummy.enviarEmail).not.toHaveBeenCalled();
    });
  });

  describe("quando um cliente Premium finaliza a compra com sucesso", () => {
    test("deve aplicar 10% de desconto, cobrar valor correto, salvar pedido e enviar e-mail (mocks)", async () => {
      // Arrange
      const usuarioPremium = UserMother.umUsuarioPremium(); // email: premium@email.com
      // total bruto = 200
      const itens = [
        new Item("SKU-10", "Teclado", 120, 1),
        new Item("SKU-11", "Mousepad", 80, 1),
      ];
      const carrinho = new CarrinhoBuilder().comUser(usuarioPremium).comItens(itens).build();

      // Gateway STUB: força retorno de sucesso=true para verificar comportamento subsequente
      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true, authId: "AUTH-123" }) };

      // Repository STUB: simula persistência e retorna um Pedido "salvo"
      const pedidoSalvo = new Pedido("PED-001", carrinho.user, carrinho.itens, 180 /* total com desconto */, "APROVADO");
      const pedidoRepositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };

      // EmailService MOCK: queremos verificar interação (vezes/args)
      const emailMock = { enviarEmail: jest.fn().mockResolvedValue(true) };

      const checkoutService = new CheckoutService(gatewayStub, emailMock, pedidoRepositoryStub);

      // Act
      const pedido = await checkoutService.processarPedido(carrinho);

      // Assert
      // 1) desconto de 10% sobre 200 => 180
      expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
      // Chamada com valor com desconto
      expect(gatewayStub.cobrar.mock.calls[0][0]).toBe(180);

      // 2) pedido salvo
      expect(pedidoRepositoryStub.salvar).toHaveBeenCalledTimes(1);
      expect(pedido).toBe(pedidoSalvo);
      expect(pedido.total).toBe(180);
      expect(pedido.status).toBe("APROVADO");

      // 3) email enviado uma vez com e-mail do premium e mensagem
      expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
      const [to, subject] = emailMock.enviarEmail.mock.calls[0];
      expect(to).toBe("premium@email.com");
      expect(subject).toMatch(/Aprovado/i);
    });
  });
});