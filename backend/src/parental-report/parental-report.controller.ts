import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParentalReportService } from './parental-report.service';

@Controller('parental-report')
export class ParentalReportController {
  constructor(private readonly parentalReportService: ParentalReportService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  async generateReport(
    @Body() body: { studentId: number; studentName?: string; reportType: string },
    @Request() req,
  ) {
    const report = await this.parentalReportService.generateReport(
      req.user.sub,
      body.studentId,
      body.reportType,
    );
    return {
      status: 200,
      message: 'Report generated successfully',
      result: report,
    };
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyReports(@Request() req, @Query('limit') limit?: string) {
    const reports = await this.parentalReportService.getReportsByParent(
      req.user.sub,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      status: 200,
      result: reports,
    };
  }

  @Get('student/:studentId')
  @UseGuards(AuthGuard('jwt'))
  async getStudentReports(@Param('studentId') studentId: string, @Query('limit') limit?: string) {
    const reports = await this.parentalReportService.getReportsByStudent(
      parseInt(studentId, 10),
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      status: 200,
      result: reports,
    };
  }

  @Get('linked-students')
  @UseGuards(AuthGuard('jwt'))
  async getLinkedStudents(@Request() req) {
    const students = await this.parentalReportService.getLinkedStudents(req.user.sub);
    return {
      status: 200,
      result: students,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getReportById(@Param('id') id: string) {
    const report = await this.parentalReportService.getReportById(parseInt(id, 10));
    return {
      status: 200,
      result: report,
    };
  }

  @Put(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  async approveReport(@Param('id') id: string, @Body('comment') comment?: string) {
    const report = await this.parentalReportService.approveReport(parseInt(id, 10), comment);
    return {
      status: 200,
      message: 'Report approved',
      result: report,
    };
  }

  @Put(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  async rejectReport(@Param('id') id: string, @Body('comment') comment?: string) {
    const report = await this.parentalReportService.rejectReport(parseInt(id, 10), comment);
    return {
      status: 200,
      message: 'Report rejected',
      result: report,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReport(@Param('id') id: string) {
    const success = await this.parentalReportService.deleteReport(parseInt(id, 10));
    return {
      status: success ? 200 : 400,
      message: success ? 'Report deleted' : 'Failed to delete report',
    };
  }
}