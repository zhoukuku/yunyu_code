import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSubmissionIdToCompetitionEvaluations1782452908722 implements MigrationInterface {
    name = 'AddSubmissionIdToCompetitionEvaluations1782452908722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('competition_evaluations', new TableColumn({
            name: 'submissionId',
            type: 'integer',
            isNullable: true,
        }));

        // Also add an index on submissionId for efficient lookups
        await queryRunner.query(`CREATE INDEX "IDX_comp_eval_submissionId" ON "competition_evaluations" ("submissionId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comp_eval_submissionId"`);
        await queryRunner.dropColumn('competition_evaluations', 'submissionId');
    }
}
