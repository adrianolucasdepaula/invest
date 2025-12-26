#!/usr/bin/env python3
"""
Analyze Bulk Update Logs - Real-time Analysis
Analisa logs do backend em tempo real durante atualização em massa
"""

import subprocess
import re
import json
import time
from datetime import datetime
from collections import defaultdict, Counter
from typing import Dict, List, Tuple

class BulkUpdateAnalyzer:
    def __init__(self):
        self.stats = {
            'traces': defaultdict(list),
            'errors_by_type': Counter(),
            'success_by_ticker': [],
            'failed_by_ticker': [],
            'deviations': [],
            'filter_actions': [],
            'confidence_scores': [],
            'scraper_performance': defaultdict(list),
        }
        self.start_time = datetime.now()

    def get_recent_logs(self, since_seconds=30):
        """Get logs from last N seconds"""
        try:
            cmd = ['docker', 'logs', 'invest_backend', '--since', f'{since_seconds}s']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return result.stdout + result.stderr
        except Exception as e:
            print(f"❌ Erro ao obter logs: {e}")
            return ""

    def parse_trace_id(self, log_line: str) -> str:
        """Extract trace ID from log"""
        match = re.search(r'\[TRACE-([a-z0-9]+)\]', log_line)
        return match.group(1) if match else None

    def parse_deviation(self, log_line: str) -> float:
        """Extract deviation value from log"""
        match = re.search(r'deviation[:\s]+([0-9.e+]+)%?', log_line, re.I)
        if match:
            try:
                return float(match.group(1))
            except:
                pass
        return None

    def analyze_logs(self, logs: str):
        """Analyze logs and extract statistics"""

        # 1. Traces e Erros
        for line in logs.split('\n'):
            trace_id = self.parse_trace_id(line)
            if trace_id:
                self.stats['traces'][trace_id].append(line)

            # Erros por tipo
            if 'Low confidence' in line:
                self.stats['errors_by_type']['low_confidence'] += 1
                if match := re.search(r'update (\w+):', line):
                    self.stats['failed_by_ticker'].append(match.group(1))

            elif 'timed out' in line.lower():
                self.stats['errors_by_type']['timeout'] += 1

            elif 'ERROR' in line:
                self.stats['errors_by_type']['other'] += 1

            # Sucessos
            if 'Saved fundamental data for' in line:
                if match := re.search(r'for (\w+)', line):
                    ticker = match.group(1)
                    self.stats['success_by_ticker'].append(ticker)

            # Filtragem de fontes
            if '[FILTER]' in line:
                self.stats['filter_actions'].append(line)

            # Desvios
            deviation = self.parse_deviation(line)
            if deviation:
                self.stats['deviations'].append(deviation)

            # Confiança
            if match := re.search(r'confidence[:\s]+([0-9.]+)', line, re.I):
                try:
                    conf = float(match.group(1))
                    self.stats['confidence_scores'].append(conf)
                except:
                    pass

    def print_statistics(self):
        """Print current statistics"""
        elapsed = (datetime.now() - self.start_time).total_seconds()

        print("\n" + "="*70)
        print(f"  ESTATÍSTICAS - {datetime.now().strftime('%H:%M:%S')}")
        print("="*70)

        # Resumo
        print("\n[RESUMO GERAL]")
        print(f"  ✅ Sucessos:         {len(self.stats['success_by_ticker'])}")
        print(f"  ❌ Falhas:           {len(self.stats['failed_by_ticker'])}")
        print(f"  ⏱️  Tempo decorrido:  {elapsed:.0f}s ({elapsed/60:.1f} min)")

        if len(self.stats['success_by_ticker']) > 0:
            rate = len(self.stats['success_by_ticker']) / elapsed
            eta = (861 - len(self.stats['success_by_ticker'])) / rate if rate > 0 else 0
            print(f"  📊 Taxa:             {rate:.2f} ativos/s")
            print(f"  🕐 ETA:              {eta/60:.1f} min")

        # Erros por tipo
        print("\n[ERROS POR TIPO]")
        for error_type, count in self.stats['errors_by_type'].most_common():
            print(f"  {error_type.replace('_', ' ').title():20} {count:>4}")

        # Análise de Desvios
        if self.stats['deviations']:
            print("\n[ANÁLISE DE DESVIOS]")
            deviations = self.stats['deviations']
            astronomical = sum(1 for d in deviations if d > 10000)
            high = sum(1 for d in deviations if 100 < d <= 10000)
            medium = sum(1 for d in deviations if 10 < d <= 100)
            low = sum(1 for d in deviations if d <= 10)

            print(f"  Total detectados:    {len(deviations)}")
            print(f"  > 10,000% (🔴):      {astronomical}")
            print(f"  100-10k% (🟠):       {high}")
            print(f"  10-100% (🟡):        {medium}")
            print(f"  < 10% (🟢):          {low}")
            print(f"  Máximo:              {max(deviations):.2f}%")
            print(f"  Médio:               {sum(deviations)/len(deviations):.2f}%")

        # Filtragens
        if self.stats['filter_actions']:
            print("\n[FILTRAGEM DE FONTES]")
            print(f"  Total ações:         {len(self.stats['filter_actions'])}")
            print(f"  Últimas 3:")
            for action in self.stats['filter_actions'][-3:]:
                if match := re.search(r'Field (\w+).*excluding source (\w+)', action):
                    print(f"    - {match.group(1)}: excluído {match.group(2)}")

        # Últimos sucessos
        if self.stats['success_by_ticker']:
            print("\n[ÚLTIMOS 10 SUCESSOS]")
            for ticker in self.stats['success_by_ticker'][-10:]:
                print(f"  ✓ {ticker}")

    def run_monitoring(self, duration_minutes=15, poll_interval=10):
        """Run continuous monitoring"""
        end_time = datetime.now().timestamp() + (duration_minutes * 60)

        print(f"🚀 Iniciando monitoramento por {duration_minutes} minutos...")
        print(f"   Intervalo: {poll_interval}s")
        print(f"   Início: {self.start_time.strftime('%H:%M:%S')}\n")

        iteration = 0
        while datetime.now().timestamp() < end_time:
            iteration += 1

            # Get and analyze logs
            logs = self.get_recent_logs(since_seconds=poll_interval + 5)
            self.analyze_logs(logs)

            # Print statistics
            print(f"\n{'='*70}")
            print(f"  ITERAÇÃO #{iteration}")
            self.print_statistics()

            # Check for critical issues
            recent_devs = [d for d in self.stats['deviations'][-20:] if d > 10000]
            if recent_devs:
                print("\n" + "!"*70)
                print("  ⚠️  ALERTA: DESVIOS ASTRONÔMICOS DETECTADOS!")
                print(f"  Valores: {recent_devs}")
                print("!"*70)

            time.sleep(poll_interval)

        # Final summary
        print("\n" + "="*70)
        print("  RESUMO FINAL")
        print("="*70)
        self.print_statistics()

        # Save to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f'bulk_update_report_{timestamp}.json'
        with open(report_file, 'w') as f:
            json.dump({
                'start_time': self.start_time.isoformat(),
                'end_time': datetime.now().isoformat(),
                'duration_minutes': duration_minutes,
                'stats': {
                    'total_success': len(self.stats['success_by_ticker']),
                    'total_failed': len(self.stats['failed_by_ticker']),
                    'errors_by_type': dict(self.stats['errors_by_type']),
                    'deviations': {
                        'count': len(self.stats['deviations']),
                        'max': max(self.stats['deviations']) if self.stats['deviations'] else 0,
                        'avg': sum(self.stats['deviations'])/len(self.stats['deviations']) if self.stats['deviations'] else 0,
                        'astronomical_count': sum(1 for d in self.stats['deviations'] if d > 10000),
                    },
                    'filter_actions_count': len(self.stats['filter_actions']),
                },
                'success_tickers': self.stats['success_by_ticker'],
                'failed_tickers': self.stats['failed_by_ticker'][:50],  # Primeiros 50
            }, f, indent=2)

        print(f"\n📄 Relatório salvo em: {report_file}\n")

if __name__ == '__main__':
    import sys

    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    interval = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    analyzer = BulkUpdateAnalyzer()
    try:
        analyzer.run_monitoring(duration_minutes=duration, poll_interval=interval)
    except KeyboardInterrupt:
        print("\n\n⚠️  Monitoramento interrompido pelo usuário")
        analyzer.print_statistics()
