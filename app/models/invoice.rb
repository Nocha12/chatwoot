class Invoice < ApplicationRecord
  belongs_to :account

  before_validation :set_default_additional_attributes

  private

  def set_default_additional_attributes
    self.additional_attributes = {} unless additional_attributes.is_a?(Hash)
  end
end

Invoice.prepend_mod_with('Invoice')
