class Api::V1::Accounts::InvoicesController < Api::V1::Accounts::BaseController
  before_action :invoice, except: [:index, :create]

  def index
    @invoices = Current.account.invoices
  end

  def show; end

  def create
    @invoice = Current.account.invoices.create!(permitted_params)
  end

  def update
    @invoice.update!(permitted_params)
  end

  def destroy
    @invoice.destroy!
    head :ok
  end

  private

  def invoice
    @invoice ||= Current.account.invoices.find(params[:id])
  end

  def permitted_params
    params.require(:invoice).permit(:number, :total, :status, additional_attributes: {})
  end
end

Api::V1::Accounts::InvoicesController.prepend_mod_with('Api::V1::Accounts::InvoicesController')
