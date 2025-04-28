# app/services/api_campaign_service.rb 파일 신규 생성
class ApiCampaignService
  pattr_initialize [:campaign!]

  def perform
    # 캠페인 유효성 검증
    raise "유효하지 않은 캠페인 #{campaign.id}" if campaign.inbox.inbox_type != 'API' || !campaign.one_off?
    raise '이미 완료된 캠페인입니다' if campaign.completed?

    # 다른 작업이 동시에 처리하지 않도록 캠페인 상태를 완료로 변경
    campaign.completed!

    # 레이블 기반 대상 필터링
    audience_label_ids = campaign.audience.select { |audience| audience['type'] == 'Label' }.pluck('id')
    audience_labels = campaign.account.labels.where(id: audience_label_ids).pluck(:title)
    process_audience(audience_labels)
  end

  private

  delegate :inbox, to: :campaign
  delegate :channel, to: :inbox

  def process_audience(audience_labels)
    Rails.logger.info "Starting API campaign service for campaign #{campaign.id}"
    Rails.logger.info "Processing audience with labels: #{audience_labels.inspect}"

    # 레이블에 해당하는 연락처 찾기
    campaign.account.contacts.tagged_with(audience_labels, any: true).each do |contact|
      # 해당 연락처와 연결된 대화 찾기 또는 생성
      conversation = find_or_create_conversation(contact)
      next if conversation.blank?

      # 메시지 생성
      send_campaign_message(conversation)
    end
  end

  def find_or_create_conversation(contact)
    # 연락처에 대한 contact_inbox 찾기
    contact_inbox = contact.contact_inboxes.find_by(inbox_id: inbox.id)

    # contact_inbox가 없으면 생성
    contact_inbox = ContactInbox.create!(contact: contact, inbox: inbox) if contact_inbox.blank?

    # 대화 찾기 또는 생성
    conversation = Conversation.where(contact_inbox_id: contact_inbox.id).last

    if conversation.blank?
      conversation = Conversation.create!(
        account_id: campaign.account_id,
        inbox_id: inbox.id,
        contact_id: contact.id,
        contact_inbox_id: contact_inbox.id,
        campaign_id: campaign.id
      )
    end

    conversation
  end

  def send_campaign_message(conversation)
    # 캠페인 메시지 생성
    message = conversation.messages.create!(
      account_id: campaign.account_id,
      inbox_id: inbox.id,
      message_type: :outgoing,
      content: campaign.message,
      sender: campaign.sender || inbox.account.users.joins(:account_users).where(account_users: { account_id: campaign.account_id,
                                                                                                  role: :administrator }).first
    )

    # API 인박스에 웹훅 URL이 설정되어 있으면 웹훅으로 발송
    send_webhook_notification(message) if channel.webhook_url.present?
  end

  def send_webhook_notification(message)
    # 웹훅 발송 로직
    payload = message.webhook_data.merge(event: 'message_created')

    begin
      response = HTTParty.post(
        channel.webhook_url,
        headers: { 'Content-Type' => 'application/json' },
        body: payload.to_json
      )

      if response.success?
        Rails.logger.info "API Campaign message sent successfully: #{message.id}"
      else
        Rails.logger.error "API Campaign message webhook failed: #{response.code}, #{response.body}"
        mark_message_as_failed(message, "Webhook failed with status: #{response.code}")
      end
    rescue StandardError => e
      Rails.logger.error "API Campaign message webhook error: #{e.message}"
      mark_message_as_failed(message, "Webhook error: #{e.message}")
    end
  end

  def mark_message_as_failed(message, error_message)
    message.update!(
      status: :failed,
      external_error: error_message
    )
  end
end
