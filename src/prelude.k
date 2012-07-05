($define! list (wrap ($vau x #ignore x)))

($define! list*
     ($lambda (head . tail)
          ($if (null? tail)
            head
            (cons head (apply list* tail)))))

($define! car ($lambda ((x . #ignore)) x))
($define! cdr ($lambda ((#ignore . x)) x))

($define! apply
     ($lambda (appv arg . opt)
          (eval (cons (unwrap appv) arg)
             ($if (null? opt)
               (make-environment)
               (car opt)))))

($define! get-list-metrics
     ($lambda (ls)
          ($define! aux
               ($lambda (kth k nth n)
                   ($if (>=? k n)
                      ($if (pair? (cdr nth))
                        (aux ls 0 (cdr nth) (+ n 1))
                        (list (+ n 1)
                           ($if (null? (cdr nth)) 1 0)
                           (+ n 1)
                           0))
                      ($if (eq? kth nth)
                        (list n 0 k (- n k))
                        (aux (cdr kth) (+ k 1) nth n)))))
          ($if (pair? ls)
            (aux ls 0 ls 0)
            (list 0 ($if (null? ls) 1 0) 0 0))))

($define! list-tail
          ($lambda (ls k)
                   ($if (>? k 0)
                        (list-tail (cdr ls) (- k 1))
                        ls)))
($define! map
          (wrap ($vau (appv . lss) env
                      ($define! acc
                                ($lambda (input (k1 k2) base-result head tail sum)
                                         ($define! aux
                                                   ($lambda (input count)
                                                            ($if (=? count 0)
                                                                 base-result
                                                                 (sum (head input)
                                                                      (aux (tail input) (- count 1))))))
                                         (aux input (+ k1 k2))))
                      ($define! enlist
                                ($lambda (input ms head tail)
                                         ($define! result (acc input ms () head tail cons))
                                         (apply encycle! (list* result ms))
                                         result))
                      ($define! mss (cddr (get-list-metrics lss)))
                      ($define! cars ($lambda (lss) (enlist lss mss caar cdr)))
                      ($define! cdrs ($lambda (lss) (enlist lss mss cdar cdr)))
                      ($define! result-metrics
                                (acc lss mss (cddr (get-list-metrics (car lss)))
                                     ($lambda (lss) (cddr (get-list-metrics (car lss))))
                                     cdr
                                     ($lambda ((j1 j2) (k1 k2))
                                              (list (max j1 k1)
                                                    ($cond ((=? j2 0) k2)
                                                           ((=? k2 0) j2)
                                                           (#t (lcm j2 k2)))))))
                      (enlist lss
                              result-metrics
                              ($lambda (lss) (apply appv (cars lss) env))
                              cdrs))))


($define! $let
($vau (bindings . body) env
      (eval (cons (list* $lambda (map car bindings) body)
                  (map cadr bindings))
            env)))

($define! not? ($lambda (x) ($if x #f #t)))
($define! and?
          ($lambda x
                   ($define! aux
                             ($lambda (x k)
                                      ($cond ((<=? k 0)
                                              ((car x)
                                               (#t
                                                #t)
                                               (aux (cdr x) (- k 1)))
                                              #f))))
                   (aux x (car (get-list-metrics x)))))

($define! or?
          ($lambda x
                   (not? (apply and? (map not? x)))))

($define! $and?
          ($vau x e
                ($cond ((null? x)
                        ((null? (cdr x))
                         ((eval (car x) e) #t)
                         (eval (car x) e)) ; tail context
                        (apply (wrap $and?) (cdr x) e))
                       (#t #f))))

($define! $or?
          ($vau x e
                ($cond ((null? x)
                        ((null? (cdr x))
                         ((eval (car x) e)
                          (#t #f)
                          (eval (car x) e)) ; tail context
                         #t)
                        (apply (wrap $or?) (cdr x) e)))))

($define! combiner?
          ($lambda x
                   (apply and? (map ($lambda (x)
                                             (or? (applicative? x)
                                                  (operative? x)))
                                    x))))

($define! length
          ($lambda (object)
                   ($let (((#ignore #ignore a c)
                           ($if (>? c 0)
                                -1 ; TODO: this returns #e+infinity
                                a))))

($define! list-ref
          ($lambda (ls k)
                   (car (list-tail ls k))))

($define! filter
          ($lambda (accept? ls)
                   (apply append
                          (map ($lambda (x)
                                        ($if (apply accept? (list x))
                                             (list x)
                                             ()))
                               ls))))

($define! assoc
          ($lambda (object alist)
                   ($let ((alist (filter ($lambda (record)
                                                  (equal? object (car record)))
                                         alist)))
                         ($if (null? alist)
                              ()
                              (car alist)))))

($define! assoc*
          ($lambda (object alist)
                   ($let ((alist (filter ($lambda (record)
                                                  (equal? object (car record)))
                                         alist)))
                         ($if (null? alist)
                              (cons #f ())
                              (cons #t (car alist))))))

($define! member?
          ($lambda (object ls)
                   (apply or?
                          (map ($lambda (x) (equal? object x))
                               ls))))

($define! finite-list?
          ($lambda args
                   (apply and?
                          90
                          (map ($lambda (x)
                                        ($let (((#ignore n . #ignore)
                                                (get-list-metrics x)))
                                              (>? n 0)))
                               args))))

($define! countable-list?
          ($lambda args
                   (apply and?
                          (map ($lambda (x)
                                        ($let (((#ignore n #ignore c)
                                                (get-list-metrics x)))
                                              ($or? (>? c 0)
                                                    (>? n 0))))
                               args))))

($define! reduce
          ($let ()
                ($define! reduce-acyclic
                          ($lambda (ls bin id)
                                   ($cond ((null? ls)
                                           id)
                                          ((null? (cdr ls)) (car ls))
                                          (#t
                                           (bin (car ls)
                                                (reduce-acyclic (cdr ls) bin id))))))
                ($define! reduce-n
                          ($lambda (ls bin n)
                                   ($if (=? n 1)
                                        (car ls)
                                        (bin (car ls)
                                             (reduce-n (cdr ls) bin (- n 1))))))
                (wrap ($vau (ls bin id . opt) env
                            ($define! fixenv
                                      ($lambda (appv)
                                               ($lambda x (apply appv x env))))
                            ($define! bin (fixenv bin))
                            ($let (((p n a c) (get-list-metrics ls)))
                                  ($if (=? c 0)
                                       (reduce-acyclic ls bin id)
                                       ($sequence
                                         ($define! (pre in post) (map fixenv opt))
                                         ($define! reduced-cycle
                                                   (post (reduce-n (map pre (list-tail ls a))
                                                                   in
                                                                   c)))
                                         ($if (=? a 0)
                                              reduced-cycle
                                              (bin (reduce-n ls bin a)
                                                   reduced-cycle)))))))))

($define! assq
          ($lambda (object alist)
                   ($let ((alist (filter ($lambda (record)
                                                  (eq? object (car record)))
                                         alist)))
                         ($if (null? alist)
                              ()
                              (car alist)))))

($define! memq?
          ($lambda (object ls)
                   (apply or?
                          (map ($lambda (x) (eq? object x))
                               ls))))

($define! make-kernel-standard-environment
          ($lambda () (get-current-environment)))

($define! $let*
          ($vau (bindings . body) env
                (eval ($if (null? bindings)
                           (list* $let bindings body)
                           (list $let
                                 (list (car bindings))
                                 (list* $let* (cdr bindings) body)))
                      env)))

($define! $letrec
          ($vau (bindings . body) env
                (eval (list* $let ()
                             (list $define!
                                   (map car bindings)
                                   (list* list (map cadr bindings)))
                             body)
                      env)))

($define! $letrec*
          ($vau (bindings . body) env
                (eval ($if (null? bindings)
                           (list* $letrec bindings body)
                           (list $letrec
                                 (list (car bindings))
                                 (list* $letrec* (cdr bindings) body)))
                      env)))

($define! $let-redirect
          ($vau (exp bindings . body) env
                (eval (list* (eval (list* $lambda (map car bindings) body)
                                   (eval exp
                                         env))
                             (map cadr bindings))
                      env)))

($define! $let-safe
          ($vau (bindings . body) env
                (eval (list* $let-redirect
                             (make-kernel-standard-environment)
                             bindings
                             body)
                      env)))

($define! $remote-eval
          ($vau (o e) d
                (eval o (eval e d))))


($define! $bindings->environment
          ($vau bindings denv
                (eval (list $let-redirect
                            (make-environment)
                            bindings
                            (list get-current-environment))
                      denv)))

($define! $provide!
          ($vau (symbols . body) env
                (eval (list $define! symbols
                            (list $let ()
                                  (list* $sequence body)
                                  (list* list symbols)))
                      env)))


($define! $import!
          ($vau (exp . symbols) env
                (eval (list $set!
                            env
                            symbols
                            (cons list symbols))
                      (eval exp env))))

($define! for-each
          (wrap ($vau x env
                      (apply map x env)
                      #inert)))

($define! apply-continuation
          ($lambda (c o)
                   (apply (continuation->applicative c) o)))

($define! $let/cc
          ($vau (symbol . body) env
                (eval (list call/cc (list* $lambda (list symbol) body))
                      env)))

($define! exit
          ($lambda ()
                   (apply-continuation root-continuation #inert)))

; missing:
; * $binds?
; * $set!
; * append (requires list mutation primitives)
; * append!
; * copy-es
; * list-neigbours (requires encycle!)
;
