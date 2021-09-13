(define-constant UNAUTHORIZED_SETTER (err u100))
(define-constant deployer tx-sender)
(define-constant lifetime u1008)
(define-data-var last-block-update-at uint block-height)

(define-map inheritors {inheritor: principal}
    {enabled: bool}
)

(define-public (add-inheritor (inheritor principal))
    (begin
        (asserts! (is-eq contract-caller deployer) UNAUTHORIZED_SETTER)
        (ok
            (map-insert inheritors { inheritor: inheritor } { enabled: true })
        )
    )
)


