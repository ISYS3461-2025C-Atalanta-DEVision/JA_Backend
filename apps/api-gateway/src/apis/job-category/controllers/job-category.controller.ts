import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { firstValueFrom, timeout, catchError } from "rxjs";
import { Public, Roles } from "@auth/decorators";
import { ApiKeyOrJweGuard, RolesGuard } from "@auth/guards";
import { Role } from "@auth/enums";
import { CreateJobCategoryDto, UpdateJobCategoryDto } from "../dtos";
import {
  parseFilters,
  parseSorting,
  validatePagination,
} from "../../../shared/utils/query-parser.util";

@ApiTags("Job Categories")
@Controller("job-categories")
export class JobCategoryController {
  constructor(
    @Inject("JOB_SKILL_SERVICE") private readonly client: ClientProxy,
  ) {}

  private handleError(error: any) {
    if (error.status) {
      throw error;
    }
    throw error;
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: "Get all job categories",
    description: "Retrieve paginated list of job categories",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "filters",
    required: false,
    type: String,
    description:
      'JSON array of filters: [{"id":"fieldName","value":"searchValue","operator":"contains"}]',
  })
  @ApiQuery({
    name: "sorting",
    required: false,
    type: String,
    description: 'JSON array of sorting: [{"id":"fieldName","desc":true}]',
  })
  @ApiResponse({
    status: 200,
    description: "List of job categories retrieved successfully",
  })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("filters") filtersJson?: string,
    @Query("sorting") sortingJson?: string,
  ) {
    const pagination = validatePagination(page, limit);
    return firstValueFrom(
      this.client
        .send(
          { cmd: "jobCategory.findAll" },
          {
            page: pagination.page,
            limit: pagination.limit,
            filters: parseFilters(filtersJson),
            sorting: parseSorting(sortingJson),
          },
        )
        .pipe(
          timeout(5000),
          catchError((err) => {
            this.handleError(err);
            throw err;
          }),
        ),
    );
  }

  @Get(":id")
  @Public()
  @ApiOperation({
    summary: "Get job category by ID",
    description: "Retrieve a single job category by its ID",
  })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 200,
    description: "Job category retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Job category not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findById(@Param("id") id: string) {
    return firstValueFrom(
      this.client.send({ cmd: "jobCategory.findById" }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create job category",
    description: "Create a new job category (Admin only)",
  })
  @ApiBody({ type: CreateJobCategoryDto })
  @ApiResponse({
    status: 201,
    description: "Job category created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async create(@Body() createDto: CreateJobCategoryDto) {
    return firstValueFrom(
      this.client.send({ cmd: "jobCategory.create" }, createDto).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Update job category",
    description: "Update an existing job category (Admin only)",
  })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiBody({ type: UpdateJobCategoryDto })
  @ApiResponse({
    status: 200,
    description: "Job category updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  @ApiResponse({ status: 404, description: "Job category not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateJobCategoryDto,
  ) {
    return firstValueFrom(
      this.client
        .send({ cmd: "jobCategory.update" }, { id, updates: updateDto })
        .pipe(
          timeout(5000),
          catchError((err) => {
            this.handleError(err);
            throw err;
          }),
        ),
    );
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Soft delete job category",
    description: "Soft delete a job category (Admin only)",
  })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 200,
    description: "Job category soft deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  @ApiResponse({ status: 404, description: "Job category not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async softDelete(@Param("id") id: string) {
    return firstValueFrom(
      this.client.send({ cmd: "jobCategory.delete" }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Delete(":id/hard")
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Hard delete job category",
    description: "Permanently delete a job category (Admin only)",
  })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({ status: 200, description: "Job category permanently deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  @ApiResponse({ status: 404, description: "Job category not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async hardDelete(@Param("id") id: string) {
    return firstValueFrom(
      this.client.send({ cmd: "jobCategory.hardDelete" }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }
}
