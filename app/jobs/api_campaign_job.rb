# app/jobs/api_campaign_job.rb
class ApiCampaignJob < ApplicationJob
  queue_as :low

  def perform(campaign_id)
    campaign = Campaign.find_by(id: campaign_id)
    return if campaign.blank?

    ApiCampaignService.new(campaign: campaign).perform
  rescue StandardError => e
    Rails.logger.error "Error executing API campaign: #{e.message}"
    # 실패 시 캠페인 상태 업데이트
    campaign.update(campaign_status: :active) if campaign.present?
  end
end
