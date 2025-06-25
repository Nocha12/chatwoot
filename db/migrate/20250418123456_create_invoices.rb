class CreateInvoices < ActiveRecord::Migration[7.0]
  def change
    create_table :invoices do |t|
      t.references :account, null: false
      t.string :number
      t.decimal :total
      t.string :status
      t.jsonb :additional_attributes

      t.timestamps
    end

    add_index :invoices, :account_id
  end
end
