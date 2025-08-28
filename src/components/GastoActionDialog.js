import React from 'react';

const GastoActionDialog = ({
  gasto,
  parcelas,
  onEdit,
  onTogglePago,
  onDelete,
  onTogglePagoParcelado,
  loadingParcelas
}) => (
  <div className="gasto-action-dialog-content">
    <p><strong>Descrição:</strong> {gasto.descricao}</p>
    <p><strong>Valor:</strong> R$ {parseFloat(gasto.valor).toFixed(2)}</p>
    <p><strong>Status:</strong> {gasto.pago === 'S' ? 'Pago' : 'Não Pago'}</p>
    <div className="dialog-actions-vertical">
      <button className="dialog-action-btn edit-btn" onClick={onEdit}>Editar</button>
      <button
        className={`dialog-action-btn ${gasto.pago === 'S' ? 'estornar-btn' : 'pagar-btn'}`}
        onClick={onTogglePago}
      >
        {gasto.pago === 'S' ? 'Estornar Pagamento' : 'Pagar'}
      </button>
      <button className="dialog-action-btn delete-btn" onClick={onDelete}>
        Excluir
      </button>
    </div>
    {gasto.parcela > 1 && (
      <div className="parcelados-container">
        <h4>Parcelas</h4>
        <div className="parcelas-list">
          {loadingParcelas && <span>Carregando parcelas...</span>}
          {!loadingParcelas && parcelas.map(parc => (
            <div key={parc.id} className={`parcela-card ${parc.pago === 'S' ? 'pago' : 'nao-pago'}`}>
              <div>
                <strong>Parcela:</strong> {parc.parcela}
              </div>
              <div>
                <strong>Valor:</strong> R$ {parseFloat(parc.valor).toFixed(2)}
              </div>
              <div>
                <strong>Vencimento:</strong> {new Date(parc.vencimento).toLocaleDateString('pt-BR')}
              </div>
              <div>
                <strong>Status:</strong> <span className={parc.pago === 'S' ? 'pago' : 'nao-pago'}>{parc.pago === 'S' ? 'Pago' : 'Não Pago'}</span>
              </div>
              <button
                className={`dialog-action-btn ${parc.pago === 'S' ? 'estornar-btn' : 'pagar-btn'}`}
                onClick={() => onTogglePagoParcelado(parc)}
              >
                {parc.pago === 'S' ? 'Estornar' : 'Pagar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default GastoActionDialog;