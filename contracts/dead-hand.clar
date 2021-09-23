(use-trait fungible-token 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant UNAUTHORIZED_SETTER (err u100))
(define-constant STILL_ALIVE (err u101))
(define-constant UNAUTHORIZED_CLAIMER (err u102))
(define-constant FORBIDDEN_ACTION_AFTER_DEATH (err u103))
(define-constant LOCKED (err u104))
(define-constant deployer tx-sender)
(define-constant lifetime u1008)
(define-constant LIST_SIZE u10)
(define-data-var last-update-block-time uint block-height)
(define-data-var n-inheritors uint u0)
(define-data-var locked bool false)
(define-data-var token-contracts (list 10 principal) (list))

(define-map stx-inheritors {inheritor: principal}
    {has-claimed: bool}
)

(define-map tokens-deposited {token-contract: principal}
    {amount: uint}
)

(define-map inheritor-past-claims {inheritor: principal, token-contract: principal}
    {has-claimed: bool}
)

(define-public (add-inheritor (inheritor principal))
    (begin
        (asserts!
            (and
                (not (var-get locked))
                (is-eq contract-caller deployer)
            )
        UNAUTHORIZED_SETTER)
        (let ((n (+ (var-get n-inheritors) u1)))
            (var-set n-inheritors n)
            (ok
                (map-insert stx-inheritors { inheritor: inheritor } { has-claimed: true })
            )
        )
    )
)

(define-read-only (is-alive)
    (>= (get-time-of-death) block-height)
)

(define-read-only (get-time-of-death)
    (+ (var-get last-update-block-time) lifetime)
)

(define-read-only (get-last-update-block-time)
    (var-get last-update-block-time)
)

(define-read-only (is-inheritor)
    (is-some (map-get? stx-inheritors {inheritor: tx-sender}))
)



(define-public (deposit-tokens (ft <fungible-token>) (ft-amount uint))
    (begin
        (asserts! (var-get locked) LOCKED)
        (match (contract-call? ft transfer ft-amount tx-sender (as-contract tx-sender) (some 0x0000))
            x (begin
                (ok
                    ;; (unwrap-panic (contract-call? ft get-balance tx-sender))
                    ;; true
                    (and (map-insert tokens-deposited { token-contract: (contract-of ft) } { amount: u0 })
                        (match (as-max-len? (append (var-get token-contracts) (contract-of ft)) u10)
                            tokens (var-set token-contracts tokens)
                            false
                        )
                    )
                )
            )
            err-val (err err-val)
        )
    )
)

(define-public (get-token-balance (ft <fungible-token>))
    (ok (unwrap-panic (contract-call? ft get-balance tx-sender)))
)

(define-public (release-token (ft <fungible-token>))
    (begin
        (asserts! (not (var-get locked)) LOCKED)
        (let (
                (contract-addr (as-contract tx-sender))
                (has-claimed (map-delete stx-inheritors {inheritor: tx-sender}))
                (allowed-amount (/ (unwrap-panic (contract-call? ft get-balance tx-sender)) (var-get n-inheritors)))
                (claimer tx-sender)
            )
            (asserts! has-claimed UNAUTHORIZED_CLAIMER)
            
            
            (var-set n-inheritors (- (var-get n-inheritors) u1))
            (contract-call?
                ft
                transfer
                allowed-amount
                tx-sender
                (as-contract tx-sender)
                (some 0x0000)
            )
        )
    )
)

(define-public (get-allowed-token-amount (ft <fungible-token>))
    (ok (/ (unwrap-panic (contract-call? ft get-balance tx-sender)) (var-get n-inheritors)))
)

;; Only possible to reset-lifetime when the deployer is still alive.
;; after Death, it is no longer possible to recover
(define-public (reset-lifetime)
    (begin
        (asserts! (and
            (is-eq tx-sender deployer)
            (is-alive)
        ) UNAUTHORIZED_SETTER)

        (ok (var-set last-update-block-time block-height))
    )
)

(define-public (unlock-safe)
    (begin
        (asserts! (not (is-alive)) STILL_ALIVE)
        (ok (var-set locked false))
    )
)


(define-read-only (get-allowed-amount)
    (/ (stx-get-balance (as-contract tx-sender)) (var-get n-inheritors))
)

(define-public (release-stx-funds)
    (begin
        (asserts! (not (var-get locked)) LOCKED)
        (let (
                (contract-addr (as-contract tx-sender))
                (has-claimed (map-delete stx-inheritors {inheritor: tx-sender}))
                (allowed-amount (get-allowed-amount))
                (claimer tx-sender)
            )
            (asserts! has-claimed UNAUTHORIZED_CLAIMER)
            
            (var-set n-inheritors (- (var-get n-inheritors) u1))
            (as-contract
                (stx-transfer? allowed-amount tx-sender claimer)

            )
        )
    )
)
