import { IsArray, IsEnum, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export enum SubscriptionType {
  PRICES = 'prices',
  ANALYSIS = 'analysis',
  REPORTS = 'reports',
  PORTFOLIO = 'portfolio',
  OPTIONS = 'options',
}

export class SubscribeDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'tickers array cannot be empty' })
  @IsNotEmpty({ each: true, message: 'ticker cannot be empty' })
  tickers: string[];

  @IsArray()
  @ArrayNotEmpty({ message: 'types array cannot be empty' })
  @IsEnum(SubscriptionType, {
    each: true,
    message: 'type must be one of: prices, analysis, reports, portfolio, options',
  })
  types: SubscriptionType[];
}

export class UnsubscribeDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  tickers?: string[];

  @IsArray()
  @IsEnum(SubscriptionType, { each: true })
  types?: SubscriptionType[];
}
