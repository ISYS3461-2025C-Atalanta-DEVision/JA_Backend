import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import {
  APPLICANT_SERVICE_WEB_PROVIDER,
  SEARCH_PROFILE_SERVICE_PROVIDER,
} from "../../../constants";
import { IApplicantService } from "../../../interfaces";
import { CreateApplicantDto, UpdateApplicantDto } from "../dtos";
import {
  SearchProfileService,
  UpsertSearchProfileDto,
} from "../../../services";
import { FindAllQueryParams } from "@common/dtos/filter.dto";

@Controller()
export class ApplicantController {
  constructor(
    @Inject(APPLICANT_SERVICE_WEB_PROVIDER)
    private readonly applicantService: IApplicantService,
    @Inject(SEARCH_PROFILE_SERVICE_PROVIDER)
    private readonly searchProfileService: SearchProfileService,
  ) {}

  @MessagePattern({ cmd: "applicant.create" })
  async create(@Payload() createDto: CreateApplicantDto) {
    return await this.applicantService.create(createDto);
  }

  @MessagePattern({ cmd: "applicant.findById" })
  async findById(@Payload() data: { id: string }) {
    return await this.applicantService.findById(data.id);
  }

  @MessagePattern({ cmd: "applicant.findAll" })
  async findAll(@Payload() data: FindAllQueryParams) {
    console.log('[ApplicantController] Received filters:', JSON.stringify(data.filters));
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.applicantService.findAll(
      page,
      limit,
      data.filters,
      data.sorting,
    );
  }

  @MessagePattern({ cmd: "applicant.update" })
  async update(@Payload() data: { id: string; updates: UpdateApplicantDto }) {
    return await this.applicantService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: "applicant.delete" })
  async delete(@Payload() data: { id: string }) {
    return await this.applicantService.delete(data.id);
  }

  @MessagePattern({ cmd: "applicant.sendEmail" })
  async sendVerificationEmail(@Payload() data: { id: string }) {
    return this.applicantService.sendVerificationEmail(data.id);
  }

  @MessagePattern({ cmd: "applicant.activateEmail" })
  async activateEmail(@Payload() data: { token: string }) {
    return this.applicantService.verifyEmail(data.token);
  }

  /**
   * Set premium status (internal service use only)
   * Called by notification-service when subscription status changes
   */
  @MessagePattern({ cmd: "applicant.setPremiumStatus" })
  async setPremiumStatus(
    @Payload() data: { applicantId: string; isPremium: boolean },
  ) {
    return await this.applicantService.setPremiumStatus(
      data.applicantId,
      data.isPremium,
    );
  }

  // ==================== Search Profile TCP Handlers ====================

  @MessagePattern({ cmd: "searchProfile.get" })
  async getSearchProfile(@Payload() data: { applicantId: string }) {
    return await this.searchProfileService.getByApplicantId(data.applicantId);
  }

  @MessagePattern({ cmd: "searchProfile.upsert" })
  async upsertSearchProfile(
    @Payload() data: { applicantId: string; profile: UpsertSearchProfileDto },
  ) {
    return await this.searchProfileService.upsert(
      data.applicantId,
      data.profile,
    );
  }

  @MessagePattern({ cmd: "searchProfile.deactivate" })
  async deactivateSearchProfile(@Payload() data: { applicantId: string }) {
    return await this.searchProfileService.deactivate(data.applicantId);
  }

  @MessagePattern({ cmd: "searchProfile.activate" })
  async activateSearchProfile(@Payload() data: { applicantId: string }) {
    return await this.searchProfileService.activate(data.applicantId);
  }
}
