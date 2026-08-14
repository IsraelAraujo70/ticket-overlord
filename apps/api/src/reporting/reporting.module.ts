import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ReportingService } from './application/reporting.service';
import { ReportingStore } from './application/ports/reporting-store';
import { PostgresReportingStore } from './infrastructure/persistence/postgres-reporting-store';
import { ReportingController } from './presentation/reporting.controller';
import { ReportingExceptionFilter } from './presentation/reporting-exception.filter';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ReportingController],
  providers: [
    ReportingService,
    ReportingExceptionFilter,
    { provide: ReportingStore, useClass: PostgresReportingStore },
  ],
})
export class ReportingModule {}
