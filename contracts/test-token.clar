(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token test-token)

;; get the token balance of owner
(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance test-token owner)))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply test-token)))

;; returns the token name
(define-read-only (get-name)
  (ok "Test Token"))

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "TT"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u0))

;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (if (is-eq tx-sender sender)
    (begin
      (try! (ft-transfer? test-token amount sender recipient))
      (print memo)
      (ok true)
    )
    (err u4)))

(define-public (get-token-uri)
  (ok (some u"https://hey.test.com/test-token.json")))

(define-constant ERR_TX_IGNORED (err u6))
(define-constant ERR_NATIVE_FAILURE (err u99))

(ft-mint? test-token u100000000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (mint (amount uint))
  (ft-mint? test-token amount tx-sender))