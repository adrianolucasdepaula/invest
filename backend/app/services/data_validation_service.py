"""
Serviço de Validação Cruzada de Dados
Compara dados de múltiplas fontes para garantir precisão
"""
from typing import List, Dict, Any, Optional
from statistics import mean, stdev
from datetime import datetime
from loguru import logger


class DataValidationService:
    """
    Serviço para validação cruzada de dados de múltiplas fontes
    """

    def __init__(self, minimum_sources: int = 3):
        """
        Inicializa o serviço de validação

        Args:
            minimum_sources: Número mínimo de fontes para validação
        """
        self.minimum_sources = minimum_sources
        self.tolerance_percentage = 5.0  # Tolerância de 5% para considerar valores consistentes

    def validate_fundamental_data(
        self,
        data_from_sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Valida dados fundamentalistas de múltiplas fontes

        Args:
            data_from_sources: Lista de dados coletados de diferentes fontes

        Returns:
            Dados validados e consolidados
        """
        if len(data_from_sources) < self.minimum_sources:
            logger.warning(
                f"Número insuficiente de fontes: {len(data_from_sources)} "
                f"(mínimo: {self.minimum_sources})"
            )

        # Campos numéricos importantes para validação
        numeric_fields = [
            'price', 'p_l', 'p_vp', 'dividend_yield', 'roe', 'roa',
            'margem_liquida', 'margem_bruta', 'divida_liquida',
            'receita_liquida', 'lucro_liquido', 'lpa', 'vpa'
        ]

        # Campos de texto
        text_fields = ['name', 'sector', 'subsector']

        consolidated_data = {}
        validation_report = {
            'total_sources': len(data_from_sources),
            'validated_at': datetime.utcnow().isoformat(),
            'field_validations': {}
        }

        # Valida campos numéricos
        for field in numeric_fields:
            result = self._validate_numeric_field(field, data_from_sources)
            if result:
                consolidated_data[field] = result['value']
                validation_report['field_validations'][field] = result['validation']

        # Valida campos de texto (usa votação por maioria)
        for field in text_fields:
            result = self._validate_text_field(field, data_from_sources)
            if result:
                consolidated_data[field] = result['value']
                validation_report['field_validations'][field] = result['validation']

        # Adiciona metadados
        consolidated_data['validation_report'] = validation_report
        consolidated_data['is_validated'] = self._is_data_reliable(validation_report)
        consolidated_data['data_quality_score'] = self._calculate_quality_score(validation_report)

        return consolidated_data

    def _validate_numeric_field(
        self,
        field_name: str,
        data_from_sources: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Valida um campo numérico comparando valores de múltiplas fontes

        Args:
            field_name: Nome do campo
            data_from_sources: Dados de múltiplas fontes

        Returns:
            Dicionário com valor validado e informações de validação
        """
        values = []
        sources_with_data = []

        # Coleta valores de todas as fontes
        for source_data in data_from_sources:
            data = source_data.get('data', {})
            if field_name in data and data[field_name] is not None:
                try:
                    value = float(data[field_name])
                    values.append(value)
                    sources_with_data.append(source_data.get('metadata', {}).get('source', 'unknown'))
                except (ValueError, TypeError):
                    continue

        if not values:
            return None

        # Calcula estatísticas
        avg_value = mean(values)
        std_deviation = stdev(values) if len(values) > 1 else 0

        # Verifica consistência
        is_consistent = self._check_consistency(values, avg_value)

        # Identifica outliers
        outliers = []
        for i, value in enumerate(values):
            if not self._is_within_tolerance(value, avg_value):
                outliers.append({
                    'value': value,
                    'source': sources_with_data[i]
                })

        return {
            'value': avg_value,
            'validation': {
                'num_sources': len(values),
                'sources': sources_with_data,
                'all_values': values,
                'std_deviation': std_deviation,
                'is_consistent': is_consistent,
                'outliers': outliers,
                'confidence': self._calculate_confidence(len(values), is_consistent)
            }
        }

    def _validate_text_field(
        self,
        field_name: str,
        data_from_sources: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Valida campo de texto usando votação por maioria

        Args:
            field_name: Nome do campo
            data_from_sources: Dados de múltiplas fontes

        Returns:
            Valor mais comum e validação
        """
        values = []
        sources = []

        for source_data in data_from_sources:
            data = source_data.get('data', {})
            if field_name in data and data[field_name]:
                value = str(data[field_name]).strip()
                if value:
                    values.append(value)
                    sources.append(source_data.get('metadata', {}).get('source', 'unknown'))

        if not values:
            return None

        # Conta ocorrências
        value_counts = {}
        for value in values:
            value_counts[value] = value_counts.get(value, 0) + 1

        # Valor mais comum
        most_common = max(value_counts.items(), key=lambda x: x[1])
        chosen_value = most_common[0]
        count = most_common[1]

        return {
            'value': chosen_value,
            'validation': {
                'num_sources': len(values),
                'sources': sources,
                'all_values': list(set(values)),
                'agreement_count': count,
                'agreement_percentage': (count / len(values)) * 100,
                'is_unanimous': len(set(values)) == 1
            }
        }

    def _is_within_tolerance(self, value: float, reference: float) -> bool:
        """
        Verifica se valor está dentro da tolerância

        Args:
            value: Valor a verificar
            reference: Valor de referência

        Returns:
            True se está dentro da tolerância
        """
        if reference == 0:
            return value == 0

        percentage_diff = abs((value - reference) / reference) * 100
        return percentage_diff <= self.tolerance_percentage

    def _check_consistency(self, values: List[float], avg_value: float) -> bool:
        """
        Verifica se valores são consistentes

        Args:
            values: Lista de valores
            avg_value: Valor médio

        Returns:
            True se consistentes
        """
        if not values:
            return False

        # Todos os valores devem estar dentro da tolerância
        consistent_values = sum(1 for v in values if self._is_within_tolerance(v, avg_value))

        # Considera consistente se pelo menos 70% dos valores estão dentro da tolerância
        return (consistent_values / len(values)) >= 0.7

    def _calculate_confidence(self, num_sources: int, is_consistent: bool) -> float:
        """
        Calcula score de confiança

        Args:
            num_sources: Número de fontes
            is_consistent: Se dados são consistentes

        Returns:
            Score de confiança (0-1)
        """
        # Peso por número de fontes (max 0.5)
        source_score = min(num_sources / 5.0, 1.0) * 0.5

        # Peso por consistência (max 0.5)
        consistency_score = 0.5 if is_consistent else 0.2

        return source_score + consistency_score

    def _calculate_quality_score(self, validation_report: Dict[str, Any]) -> float:
        """
        Calcula score geral de qualidade dos dados

        Args:
            validation_report: Relatório de validação

        Returns:
            Score de qualidade (0-1)
        """
        field_validations = validation_report.get('field_validations', {})

        if not field_validations:
            return 0.0

        confidence_scores = []

        for field, validation in field_validations.items():
            if 'confidence' in validation:
                confidence_scores.append(validation['confidence'])
            elif validation.get('is_unanimous'):
                confidence_scores.append(1.0)
            elif 'agreement_percentage' in validation:
                confidence_scores.append(validation['agreement_percentage'] / 100.0)

        if not confidence_scores:
            return 0.0

        return mean(confidence_scores)

    def _is_data_reliable(self, validation_report: Dict[str, Any]) -> bool:
        """
        Determina se dados são confiáveis

        Args:
            validation_report: Relatório de validação

        Returns:
            True se dados são confiáveis
        """
        quality_score = self._calculate_quality_score(validation_report)
        num_sources = validation_report.get('total_sources', 0)

        # Considera confiável se:
        # 1. Tem pelo menos o mínimo de fontes
        # 2. Score de qualidade >= 0.6
        return num_sources >= self.minimum_sources and quality_score >= 0.6
