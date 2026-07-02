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
    // Verify the parent-student relationship exists
    const linkedStudents = await this.parentalReportService.getLinkedStudents(req.user.sub);
    const isLinked = linkedStudents.some(s => s.studentId === body.studentId);
    if (!isLinked) {
      return {
        status: 403,
        message: 'You can only generate reports for your linked students',
      };
    }
    const report = await this.parentalReportService.generateReport(
      req.user.sub,
      body.studentId,
      body.reportType,
      body.studentName,
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
  async getStudentReports(@Param('studentId') studentId: string, @Request() req: any, @Query('limit') limit?: string) {
    const targetStudentId = parseInt(studentId, 10);
    // Students can view their own reports; parents can view linked students' reports
    if (req.user.sub !== targetStudentId) {
      const linkedStudents = await this.parentalReportService.getLinkedStudents(req.user.sub);
      const isLinked = linkedStudents.some(s => s.studentId === targetStudentId);
      if (!isLinked) {
        return {
          status: 403,
          message: 'You can only view reports for yourself or your linked students',
        };
      }
    }
    const reports = await this.parentalReportService.getReportsByStudent(
      targetStudentId,
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
  async getReportById(@Param('id') id: string, @Request() req: any) {
    const report = await this.parentalReportService.getReportById(parseInt(id, 10));
    if (!report) {
      return { status: 404, message: 'Report not found' };
    }
    // Only the parent who generated the report or the student can view it
    if (report.parentId !== req.user.sub && report.studentId !== req.user.sub) {
      return { status: 403, message: 'You can only view your own reports' };
    }
    return {
      status: 200,
      result: report,
    };
  }

  @Put(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  async approveReport(@Param('id') id: string, @Request() req: any, @Body('comment') comment?: string) {
    const report = await this.parentalReportService.getReportById(parseInt(id, 10));
    if (!report) {
      return { status: 404, message: 'Report not found' };
    }
    // Only the parent who generated the report can approve it
    if (report.parentId !== req.user.sub) {
      return { status: 403, message: 'You can only approve your own reports' };
    }
    const updated = await this.parentalReportService.approveReport(parseInt(id, 10), comment);
    return {
      status: 200,
      message: 'Report approved',
      result: updated,
    };
  }

  @Put(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  async rejectReport(@Param('id') id: string, @Request() req: any, @Body('comment') comment?: string) {
    const report = await this.parentalReportService.getReportById(parseInt(id, 10));
    if (!report) {
      return { status: 404, message: 'Report not found' };
    }
    if (report.parentId !== req.user.sub) {
      return { status: 403, message: 'You can only reject your own reports' };
    }
    const updated = await this.parentalReportService.rejectReport(parseInt(id, 10), comment);
    return {
      status: 200,
      message: 'Report rejected',
      result: updated,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReport(@Param('id') id: string, @Request() req: any) {
    const report = await this.parentalReportService.getReportById(parseInt(id, 10));
    if (!report) {
      return { status: 404, message: 'Report not found' };
    }
    if (report.parentId !== req.user.sub) {
      return { status: 403, message: 'You can only delete your own reports' };
    }
    const success = await this.parentalReportService.deleteReport(parseInt(id, 10));
    return {
      status: success ? 200 : 400,
      message: success ? 'Report deleted' : 'Failed to delete report',
    };
  }
}