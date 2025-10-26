"""
Teste manual dos parsers de importação
Execute: python -m tests.test_parsers_manual
"""
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.parsers.portfolio_parsers import ParserFactory


def test_myprofit_parser():
    """Testa parser do MyProfit"""
    print("\n" + "="*60)
    print("TESTE: MyProfit Parser")
    print("="*60)

    # Ler arquivo de exemplo
    with open("tests/data/parsers/myprofit_example.csv", "r") as f:
        csv_data = f.read()

    # Criar parser e fazer parse
    parser = ParserFactory.create_parser("myprofit")
    result = parser.parse(csv_data)

    # Mostrar resultado
    print(f"✅ Nome: {result['name']}")
    print(f"✅ Fonte: {result['source']}")
    print(f"✅ Posições: {len(result['positions'])}")
    print("\nPosições parseadas:")
    for pos in result['positions']:
        print(f"  - {pos['ticker']}: {pos['quantity']} @ R$ {pos['average_price']:.2f} ({pos['asset_type']})")

    return result


def test_investidor10_parser():
    """Testa parser do Investidor10"""
    print("\n" + "="*60)
    print("TESTE: Investidor10 Parser")
    print("="*60)

    # Ler arquivo de exemplo
    with open("tests/data/parsers/investidor10_example.csv", "r") as f:
        csv_data = f.read()

    # Criar parser e fazer parse
    parser = ParserFactory.create_parser("investidor10")
    result = parser.parse(csv_data)

    # Mostrar resultado
    print(f"✅ Nome: {result['name']}")
    print(f"✅ Fonte: {result['source']}")
    print(f"✅ Posições: {len(result['positions'])}")
    print("\nPosições parseadas:")
    for pos in result['positions']:
        print(f"  - {pos['ticker']}: {pos['quantity']} @ R$ {pos['average_price']:.2f} ({pos['asset_type']})")

    return result


def test_nuinvest_parser():
    """Testa parser do Nu Invest"""
    print("\n" + "="*60)
    print("TESTE: Nu Invest Parser")
    print("="*60)

    # Ler arquivo de exemplo
    with open("tests/data/parsers/nuinvest_example.json", "r") as f:
        json_data = f.read()

    # Criar parser e fazer parse
    parser = ParserFactory.create_parser("nuinvest")
    result = parser.parse(json_data)

    # Mostrar resultado
    print(f"✅ Nome: {result['name']}")
    print(f"✅ Fonte: {result['source']}")
    print(f"✅ Posições: {len(result['positions'])}")
    print("\nPosições parseadas:")
    for pos in result['positions']:
        print(f"  - {pos['ticker']}: {pos['quantity']} @ R$ {pos['average_price']:.2f} ({pos['asset_type']})")

    return result


def test_parser_factory():
    """Testa ParserFactory"""
    print("\n" + "="*60)
    print("TESTE: ParserFactory")
    print("="*60)

    supported = ParserFactory.get_supported_sources()
    print(f"✅ Fontes suportadas: {', '.join(supported)}")

    # Testar criação de cada parser
    for source in supported:
        parser = ParserFactory.create_parser(source)
        print(f"✅ Parser criado: {parser.__class__.__name__}")

    # Testar fonte inválida
    try:
        ParserFactory.create_parser("invalid_source")
        print("❌ ERRO: Deveria ter lançado ValueError")
    except ValueError as e:
        print(f"✅ ValueError correta: {str(e)}")


def main():
    """Executa todos os testes"""
    print("\n" + "#"*60)
    print("# TESTES DE PARSERS DE PORTFÓLIO")
    print("#"*60)

    try:
        # Testar Factory
        test_parser_factory()

        # Testar cada parser
        myprofit_result = test_myprofit_parser()
        investidor10_result = test_investidor10_parser()
        nuinvest_result = test_nuinvest_parser()

        # Sumário
        print("\n" + "="*60)
        print("SUMÁRIO DOS TESTES")
        print("="*60)
        print(f"✅ MyProfit: {len(myprofit_result['positions'])} posições")
        print(f"✅ Investidor10: {len(investidor10_result['positions'])} posições")
        print(f"✅ Nu Invest: {len(nuinvest_result['positions'])} posições")
        print(f"\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!")

    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
