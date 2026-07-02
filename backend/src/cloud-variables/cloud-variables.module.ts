import { Module, Global } from '@nestjs/common';
import { CloudVariablesGateway } from './cloud-variables.gateway';

@Global()
@Module({
  providers: [CloudVariablesGateway],
  exports: [CloudVariablesGateway],
})
export class CloudVariablesModule {}
