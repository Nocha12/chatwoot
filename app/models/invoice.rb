# == Schema Information
#
# Table name: invoices
#
#  id                    :bigint           not null, primary key
#  additional_attributes :jsonb
#  number                :string
#  status                :string
#  total                 :decimal(, )
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  account_id            :bigint           not null
#
# Indexes
#
#  index_invoices_on_account_id  (account_id)
#
class Invoice < ApplicationRecord
  belongs_to :account

  before_validation :set_default_additional_attributes

  private

  def set_default_additional_attributes
    self.additional_attributes = {} unless additional_attributes.is_a?(Hash)
  end
end

Invoice.prepend_mod_with('Invoice')
