var fsm;
describe( "machina.Fsm", function () {
	describe( "When creating a new Fsm", function () {
		describe( "When verifying core behavior", function () {
			var event1 = 0,
				event2 = 0,
				event3 = 0,
				noHandlerInvoked = false,
				transitionedHandler = false,
				handlingHandler = false,
				handledHandler = false,
				invalidStateHandler = false,
				customEventInvoked = false,
				onEnterInvoked = false,
				onExitInvoked = false,
				enterExitOrder = [],
				xfsm = new machina.Fsm( {
					states : {
						"uninitialized" : {
							"event1" : function () {
								event1++;
								this.emit( "CustomEvent" );
								this.transition( "initialized" );
							},
							_onExit : function () {
								onExitInvoked = true;
								enterExitOrder.push( "exit" );
							}
						},
						"initialized" : {
							_onEnter : function () {
								onEnterInvoked = true;
								enterExitOrder.push( "enter" );
							},
							"event2" : function () {
								event2++;
							},
							"event3" : function () {
								event3++;
							}
						}
					},
					eventListeners : {
						"nohandler" : [function () {
							noHandlerInvoked = true;
						}],
						"transition" : [function () {
							transitionedHandler = true;
						}],
						"handling" : [function () {
							handlingHandler = true;
						}],
						"handled" : [function () {
							handledHandler = true;
						}],
						"invalidstate" : [function () {
							invalidStateHandler = true;
						}],
						"CustomEvent" : [function () {
							customEventInvoked = true;
						}]
					}
				} );
			xfsm.handle( "nothingwillgetthis" );
			xfsm.handle( "event1" );
			xfsm.handle( "event2" );
			xfsm.handle( "event3" );
			xfsm.transition( "NoSuchState" );

			it( "should fire the transition event", function () {
				expect( transitionedHandler ).to.be( true );
			} );
			it( "should fire the nohandler event", function () {
				expect( noHandlerInvoked ).to.be( true );
			} );
			it( "should fire the handling event", function () {
				expect( handlingHandler ).to.be( true );
			} );
			it( "should fire the handled event", function () {
				expect( handledHandler ).to.be( true );
			} );
			it( "should fire the CustomEvent event", function () {
				expect( customEventInvoked ).to.be( true );
			} );
			it( "should fire the OnEnter handler", function () {
				expect( onEnterInvoked ).to.be( true );
			} );
			it( "should fire the OnExit handler", function () {
				expect( onExitInvoked ).to.be( true );
			} );
			it( "should fire the OnExit handler before the OnEnter handler", function () {
				expect( enterExitOrder[ 0 ] ).to.be( "exit" );
				expect( enterExitOrder[ 1 ] ).to.be( "enter" );
			} );
			it( "should fire the invalidstate handler", function () {
				expect( invalidStateHandler ).to.be( true );
			} );
			it( "should have invoked handlers", function () {
				expect( !!event1 ).to.be( true );
				expect( !!event2 ).to.be( true );
				expect( !!event3 ).to.be( true );
			} );
		} );

		describe( "When defaulting all values (other than states)", function () {
			var rgx = /.*\.[0-9]*/;
			var fsm;
			fsm = new machina.Fsm( { states : { uninitialized : {} }} );

			it( "state should default to uninitialized", function () {
				expect( fsm.state ).to.be( "uninitialized" );
			} );
			it( "events should default to 1 empty arrays", function () {
				console.log( "HERE" );
				console.log( fsm );
				expect( fsm.eventListeners["*"].length ).to.be( 0 );
			} );
			it( "namespace should default to expected pattern", function () {
				expect( rgx.test( fsm.namespace ) ).to.be( true );
			} );
			it( "event queue should be empty", function () {
				expect( fsm.eventQueue.length ).to.be( 0 );
			} );
			it( "targetReplayState should be uninitialized", function () {
				expect( fsm.targetReplayState ).to.be( "uninitialized" );
			} );
			it( "prior state should be undefined", function () {
				expect( fsm.priorState === undefined ).to.be( true );
			} );
			it( "prior action should be empty", function () {
				expect( fsm._priorAction ).to.be( "" );
			} );
			it( "current action should be empty", function () {
				expect( fsm._currentAction ).to.be( "" );
			} );
		} );

		describe( "When providing an initialize function", function () {
			var counter = 0;
			var initializeInvoked = 0;
			var onEnterInvoked = 0;
			var newFsmInvoked = 0;
			var newFsmFn = machina.on( "newfsm", function () {
				newFsmInvoked = counter;
				counter++;
				machina.off( "newfsm", newFsmFn );
			} );
			fsm = new machina.Fsm( {
				states : {
					uninitialized : {
						_onEnter : function () {
							onEnterInvoked = counter;
							counter++;
						}
					}
				},
				initialize : function () {
					initializeInvoked = counter;
					counter++;
				}
			} );
			it( "should have returned the subscriber callback when calling machina.on", function () {

			} );
			it( "should have executed initialize, newfsm and transition in proper order", function () {
				expect( initializeInvoked ).to.be( 0 );
				expect( newFsmInvoked ).to.be( 1 );
				expect( onEnterInvoked ).to.be( 2 );
			} );
		} );
	} );

	describe( "When deferring until after the next transition", function () {
		var event2 = 0,
			deferredInvoked = false,
			xfsm = new machina.Fsm( {
				states : {
					"uninitialized" : {
						"event1" : function () {
							this.transition( "initialized" );
						},
						"event2" : function () {
							this.deferUntilTransition();
						}
					},
					"initialized" : {
						"event2" : function () {
							event2++;
						}
					}
				},
				eventListeners : {
					"deferred" : [function () {
						deferredInvoked = true;
					}]
				}
			} );
		xfsm.handle( "event2" );
		xfsm.handle( "event1" );

		it( "should fire the Deferred event", function () {
			expect( deferredInvoked ).to.be( true );
		} );
		it( "should have invoked the handler on replay", function () {
			expect( event2 ).to.be( 1 );
		} );
	} );

	describe( "When deferring until a specific state", function () {
		var event2 = 0,
			deferredInvoked = false,
			xfsm = new machina.Fsm( {
				states : {
					"uninitialized" : {
						"event1" : function () {
							this.transition( "initialized" );
						},
						"event2" : function () {
							this.deferUntilTransition( "ready" );
						}
					},
					"initialized" : {
						"event1" : function () {
							this.transition( "ready" );
						},
						"event2" : function () {
							event2++;
						}
					},
					"ready" : {
						"event2" : function () {
							event2++;
						}
					}
				},
				eventListeners : {
					"deferred" : [function () {
						deferredInvoked = true;
					}]
				}
			} );
		xfsm.handle( "event2" );
		xfsm.handle( "event1" );
		xfsm.handle( "event1" );

		it( "should fire the Deferred event", function () {
			expect( deferredInvoked ).to.be( true );
		} );
		it( "should have invoked the handler once in 'ready' state", function () {
			expect( event2 ).to.be( 1 );
		} );
	} );

	describe( "When deferring until the next handler call", function () {
		var event2 = 0,
			deferredInvoked = false,
			xfsm = new machina.Fsm( {
				states : {
					"uninitialized" : {
						"event1" : function () {
							this.transition( "initialized" );
						},
						"event2" : function () {
							this.deferUntilNextHandler();
						}
					},
					"initialized" : {
						"event1" : function () {
							this.transition( "ready" );
						},
						"event2" : function () {
							event2++;
						}
					},
					"ready" : {
						"event2" : function () {
							event2++;
						}
					}
				},
				eventListeners : {
					"deferred" : [function () {
						deferredInvoked = true;
					}]
				}
			} );
		xfsm.handle( "event2" );
		xfsm.handle( "event1" );
		xfsm.handle( "event1" );

		it( "should fire the Deferred event", function () {
			expect( deferredInvoked ).to.be( true );
		} );
		it( "should have invoked the handler once", function () {
			expect( event2 ).to.be( 1 );
		} );
	} );

	describe( "When transitioning to new states from an entry action", function () {
		var booCount = 0;
		var haiCount = 0;
		var fsm = new machina.Fsm( {
			initialState : "notstarted",
			states : {
				notstarted : {
					"start" : function () {
						this.transition( "one" );
					},
					"*" : function () {
						this.deferUntilTransition();
					}
				},
				one : {
					_onEnter : function () {
						this.transition( "two" );
					},
					"hai" : function () {
						haiCount++;
					},
					"boo" : function () {
						booCount++;
					}
				},
				two : {
					_onEnter : function () {
						this.transition( "three" );
					},
					"hai" : function () {
						haiCount++;
					},
					"boo" : function () {
						booCount++;
					}
				},

				three : {
					"hai" : function () {
						haiCount++;
					},
					"boo" : function () {
						booCount++;
					}
				}
			}
		} );

		fsm.handle( "boo" );
		fsm.handle( "hai" );
		fsm.handle( "start" );

		it( "should only fire the boo and hai events once", function () {
			expect( booCount ).to.be( 1 );
			expect( haiCount ).to.be( 1 );
		} );
	} );

	describe( "When transitioning from a state with an onExit handler", function () {
		var onExitCalled = false;
		var stateOneEntry = false;
		var stateTwoEntry = false;
		var fsm = new machina.Fsm( {
			initialState : "notstarted",
			states : {
				notstarted : {
					_onEnter : function () {
						this.transition( "one" );
					},
					_onExit : function () {
						onExitCalled = true;
						this.transition( "two" );
					}
				},
				one : {
					_onEnter : function () {
						stateOneEntry = true;
					}
				},
				two : {
					_onEnter : function () {
						stateTwoEntry = true;
					}
				}
			}
		} );
		it( "should call onExit handler", function () {
			expect( onExitCalled ).to.be( true );
		} );
		it( "should call State One Entry handler", function () {
			expect( stateOneEntry ).to.be( true );
		} );
		it( "should NOT call State Two Entry handler", function () {
			expect( stateTwoEntry ).to.be( false );
		} );
	} );

	describe( "When using string handler values instead of functions", function () {
		var transitioned = false;
		var fsm = new machina.Fsm( {
			initialState : "notstarted",
			states : {
				notstarted : {
					"start" : "started"
				},
				started : {
					_onEnter : function () {
						transitioned = true;
					}
				}
			}
		} );

		fsm.handle( "start" );

		it( "should transition into the started state", function () {
			expect( transitioned ).to.be( true );
		} );
	} );

	describe( "When creating an instance from an extended constructor function", function () {
		var SomeFsm = machina.Fsm.extend( {
			initialState : "notStarted",
			states : {
				"notStarted" : {
					start : function () {
						this.transition( "started" );
					}
				},
				"started" : {
					finish : function () {
						this.transition( "finished" );
					}
				},
				"finished" : {
					_onEnter : function () {

					}
				}
			}
		} );
		var fsm = new SomeFsm();
		it( "should produce an FSM instance", function () {
			expect( typeof fsm.transition ).to.be( 'function' );
			expect( typeof fsm.processQueue ).to.be( 'function' );
			expect( typeof fsm.trigger ).to.be( 'function' );
			expect( typeof fsm.emit ).to.be( 'function' );
			expect( typeof fsm.on ).to.be( 'function' );
			expect( typeof fsm.off ).to.be( 'function' );
			expect( typeof fsm.states ).to.be( 'object' );
			expect( typeof fsm.states.notStarted ).to.be( 'object' );
			expect( typeof fsm.states.started ).to.be( 'object' );
			expect( typeof fsm.states.finished ).to.be( 'object' );
		} );
	} );

  describe("When creating two instances from the same extended constructor function", function(){
    var eventAFired = 0, eventBFired = 0;
    var SomeFsm = machina.Fsm.extend({
      initialState: "notStarted",
      states: {
        "notStarted" : {
          start : function () {
            this.trigger("customAEvent");
            this.transition( "started" );
          }
        },
        "started" : {
          finish : function () {
            this.trigger("customBEvent");
            this.transition( "finished" );
          }
        },
        "finished" : {
          _onEnter : function () {

          }
        }
      }
    });
    var fsmA = new SomeFsm();
    var fsmB = new SomeFsm({ initialState: "started" });
    fsmA.on("customAEvent", function(){
      eventAFired++;
    });
    fsmB.on("customBEvent", function(){
      eventBFired++;
    });
    fsmA.handle("start");
    fsmB.handle("finish");
    it("should not share events", function(){
      expect(fsmA.state).to.be("started");
      expect(fsmB.state).to.be("finished");
      expect(eventAFired).to.be(1);
      expect(eventBFired).to.be(1);
    });
  });

	describe( "When extending an FSM constructor function with existing states & handlers", function () {
		var SomeFsm = machina.Fsm.extend( {
			initialState : "notStarted",
			states : {
				"notStarted" : {
					start : function () {
						this.transition( "started" );
					}
				},
				"started" : {
					finish : function () {
						this.transition( "finished" );
					}
				},
				"finished" : {
					_onEnter : function () {

					}
				}
			}
		} );
		var NewerFsm = SomeFsm.extend( {
			states : {
				"inProgress" : {
					"something" : function () {

					}
				},
				started : {
					"keep.going" : function () {

					}
				}
			}
		} );
		var fsm = new NewerFsm();
		it( "should produce an FSM instance", function () {
			expect( typeof fsm.transition ).to.be( 'function' );
			expect( typeof fsm.processQueue ).to.be( 'function' );
			expect( typeof fsm.trigger ).to.be( 'function' );
			expect( typeof fsm.emit ).to.be( 'function' );
			expect( typeof fsm.on ).to.be( 'function' );
			expect( typeof fsm.off ).to.be( 'function' );
			expect( typeof fsm.states ).to.be( 'object' );
			expect( typeof fsm.states.notStarted ).to.be( 'object' );
			expect( typeof fsm.states.started ).to.be( 'object' );
			expect( typeof fsm.states.finished ).to.be( 'object' );
			expect( typeof fsm.states.inProgress ).to.be( 'object' );
			expect( typeof fsm.states.inProgress.something ).to.be( 'function' );
			expect( typeof fsm.states.started["keep.going"] ).to.be( 'function' );
		} );
	} );

	describe( "When providing a global catch-all handler", function () {
		var catchAllHandled = [],
			stateSpecificCatchAllHandled = [];

		var fsm = new machina.Fsm( {
			"*" : function ( action ) {
				catchAllHandled.push( action );
			},
			initialState : "off",
			states : {
				off : { },
				on : {
					switchoff : function () {
					}
				},
				waiting : {
					"*" : function ( action ) {
						stateSpecificCatchAllHandled.push( action );
					}
				}
			}
		} );

		beforeEach( function () {
			catchAllHandled = [];
			stateSpecificCatchAllHandled = [];
		} );

		it( "should globally catch unhandled events", function () {
			fsm.transition( "off" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			fsm.transition( "on" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			expect( catchAllHandled.length ).to.be( 3 );
		} );

		it( "should not globally catch unhandled events for which there is a state specific catch all handler", function () {
			fsm.transition( "waiting" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			expect( catchAllHandled.length ).to.be( 0 );
			expect( stateSpecificCatchAllHandled.length ).to.be( 2 );
		} );

		it( "should receive the action name as the first argument", function () {
			fsm.transition( "off" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			fsm.transition( "on" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			fsm.transition( "waiting" );
			fsm.handle( "switchon" );
			fsm.handle( "switchoff" );

			expect( catchAllHandled[0] ).to.be( "switchon" );
			expect( catchAllHandled[1] ).to.be( "switchoff" );
			expect( catchAllHandled[2] ).to.be( "switchon" );

			expect( stateSpecificCatchAllHandled[0] ).to.be( "switchon" );
			expect( stateSpecificCatchAllHandled[1] ).to.be( "switchoff" );
		} );

	} );

	describe( "When overriding the default eventListeners member", function () {
		var someEventRaised = false;
		fsm = new machina.Fsm( {
			eventListeners : { "someEvent" : [function () {
				someEventRaised = true;
			}]},
			states : {
				uninitialized : {
					doStuff : function () {
						this.emit( "someEvent" );
					}
				}
			}
		} );

		fsm.handle( "doStuff" );

		it( "should not show a '*' event placeholder", function () {
			expect( fsm.eventListeners.hasOwnProperty( "*" ) ).to.be( false );
		} );

		it( "should show a 'someEvent' event placeholder", function () {
			expect( fsm.eventListeners.hasOwnProperty( "someEvent" ) ).to.be( true );
			expect( fsm.eventListeners.someEvent.length ).to.be( 1 );
			expect( someEventRaised ).to.be( true );
		} );
	} );

	describe( "When subscribing and unsubscribing events", function () {
		var SomeFsm = machina.Fsm.extend( {
			states : {
				uninitialized : {
					doStuff : function () {
						this.emit( "someEvent" );
					}
				}
			}
		} );

		describe( "With single subscribe and unsubscribe", function(){
			var fsm = new SomeFsm();
			it( "should subscribe and unsubscribe (via off) a single listener", function () {
				var sub = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 1 );
				fsm.off(sub.eventName, sub.callback);
				expect( fsm.eventListeners.someEvent.length ).to.be( 0 );
			} );
			it( "should subscribe and unsubscribe (via ret object) a single listener", function () {
				var sub = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 1 );
				sub.off();
				expect( fsm.eventListeners.someEvent.length ).to.be( 0 );
			} );
		} );

		describe( "With multiple subscribe and single unsubscribe", function(){
			it( "should subscribe and unsubscribe (via off) a single listener", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 3 );
				fsm.off(subA.eventName, subA.callback);
				expect( fsm.eventListeners.someEvent.length ).to.be( 2 );
			} );
			it( "should subscribe and unsubscribe (via ret object) a single listener", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 3 );
				subA.off();
				expect( fsm.eventListeners.someEvent.length ).to.be( 2 );
			} );
		} );

		describe( "With multiple subscribe and multiple unsubscribe on one event", function(){
			it( "should subscribe and unsubscribe (via off)", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 3 );
				fsm.off(subA.eventName);
				expect( fsm.eventListeners.someEvent.length ).to.be( 0 );
			} );
			it( "should subscribe and unsubscribe (via ret object) a single listener", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 3 );
				subA.off();
				subB.off();
				subC.off();
				expect( fsm.eventListeners.someEvent.length ).to.be( 0 );
			} );
		} );

		describe( "With multiple subscribe and multiple unsubscribe on multiple events", function(){
			it( "should subscribe and unsubscribe (via off)", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent2", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 2 );
				expect( fsm.eventListeners.someEvent2.length ).to.be( 1 );
				fsm.off(subA.eventName, subA.callback);
				expect( fsm.eventListeners.someEvent.length ).to.be( 1 );
				expect( fsm.eventListeners.someEvent2.length ).to.be( 1 );
			} );
			it( "should subscribe and unsubscribe (via ret object) a single listener", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent2", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 2 );
				expect( fsm.eventListeners.someEvent2.length ).to.be( 1 );
				subA.off();
				expect( fsm.eventListeners.someEvent.length ).to.be( 1 );
				expect( fsm.eventListeners.someEvent2.length ).to.be( 1 );
			} );
		} );

		describe( "With multiple subscribe and global unsubscribe on a single event", function(){
			it( "should subscribe and unsubscribe (via off)", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 3 );
				fsm.off();
				expect( _.isEmpty( fsm.eventListeners ) ).to.be( true );
			} );
		} );

		describe( "With multiple subscribe and global unsubscribe on multiple events", function(){
			it( "should subscribe and unsubscribe (via off)", function () {
				var fsm = new SomeFsm();
				var subA = fsm.on("someEvent", function() { });
				var subB = fsm.on("someEvent", function() { });
				var subC = fsm.on("someEvent2", function() { });
				expect( fsm.eventListeners.someEvent.length ).to.be( 2 );
				expect( fsm.eventListeners.someEvent2.length ).to.be( 1 );
				fsm.off();
				expect( _.isEmpty( fsm.eventListeners ) ).to.be( true );
			} );
		} );
	} );
} );