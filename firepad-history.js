var FirepadHistoryList = (function() {
  function FirepadHistoryList(ref, place, userId, displayName) {
    if (!(this instanceof FirepadHistoryList)) {
      return new FirepadHistoryList(ref, place, userId, displayName);
    }

    this.ref_ = ref;
    this.userId_ = userId;
    this.place_ = place;
    this.firebaseCallbacks_ = [];

    var self = this;

    // what you have built in this file is added to the element passed in
    this.userEntryList_ = this.makeUserList_();
    place.appendChild(this.userEntryList_);
  }

  // This is the primary "constructor" for symmetry with Firepad.
  FirepadHistoryList.fromDiv = FirepadHistoryList;

  FirepadHistoryList.prototype.makeUserList_ = function() {
    /** the primary function for creating the layout,
     * other functions called from here
     */

    //return elt('div', [
    //  this.makeHeading_(),
    //  elt('div', [this.makeUserEntries_()], {'class': 'userlist' })], {'class': 'userlist' });
    return elt("div", [
      this.makeHeading_(),
      elt("div", [this.makeUserEntries_()], { class: "userlist" })
    ]);
  };

  FirepadHistoryList.prototype.makeHeading_ = function() {
    /** header */
    //return elt('div', [
    //  elt('span', 'View Collaboration Metrics')], { 'class': 'userlist' });
    return elt("div", [elt("span", "Collaboration Metrics")]);
  };

  FirepadHistoryList.prototype.makeUserEntries_ = function() {
    /** Begin to build the html from the database
     * Within here we have different help functions
     * for different types of data
     */
    var self = this;
    //var userList = elt("div");
    //var userId2Element = {};
    var userEntries = {};
    var userEntryList = elt("div");
    var displayEntries = {};
    var displayNames = {};

    // TO DO: change all of the classes to match the css you want to use
    /*
    function getUsers(userSnapshot, prevChildName) {
    
    // This function gets a list of the users currently signed in
    // and creates the html to display them
    
      var userId = userSnapshot.key;
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }

      //get the name of the user, default to guest
      var name = userSnapshot.child('name').val();
      if (typeof name !== 'string') { name = 'Guest'; }
      name = name.substring(0, 20);

      //get the color of the user, default to yellow
      var color = userSnapshot.child('color').val();
      if (!isValidColor(color)) {
        color = "#ffb"
      }

      //begins to build out the html to display
      var colorDiv = elt('div', null, { 'class': 'firepad-userlist-color-indicator' });
      colorDiv.style.backgroundColor = color;

      //var nameDiv = elt('div', name || 'Guest', { 'class': 'userlist' });
      var nameDiv = elt('div', name || 'Guest');

      var userDiv = elt('div', [ colorDiv, nameDiv ], {
        'class': 'firepad-userlist-user ' + 'firepad-user-' + userId
      });
      userId2Element[userId] = userDiv;

      //adds the new element to the list to be displayed
      var nextElement =  prevChildName ? userId2Element[prevChildName].nextSibling : userList.firstChild;
      userList.insertBefore(userDiv, nextElement);
    }

    //listeners for when things are changed in the database for the users
    this.firebaseOn_(this.ref_.child('users'), 'child_added', getUsers);
    this.firebaseOn_(this.ref_.child('users'), 'child_changed', getUsers);
    this.firebaseOn_(this.ref_.child('users'), 'child_moved', getUsers);
    this.firebaseOn_(this.ref_.child('users'), 'child_removed', function(removedSnapshot) {
      var userId = removedSnapshot.key;
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }
    });
    */

    function getHistory(userSnapshot) {
      /**
       * This function gets data about the changes made to the firepad
       */
      //edit id
      var editId = userSnapshot.key;

      //get the username for who made the edit and edit info only if
      //it is not the first default edit
      var username = "";
      var editLocation = "";
      var time = "";
      var edit = "";
      var color = "";
      if (editId !== "A0") {
        username = userSnapshot.child("a").val();
        editLocation = userSnapshot.child("o/0").val();
        time = userSnapshot.child("t").val();
        edit = userSnapshot.child("o/1").val();
        color = userSnapshot.child("color").val();
      }

      console.log(edit);
      // TO DO: do any calculations you need to with the data
      // Accumulate the number of entries made by a certain user into a dictionary userEntries
      // key: username, value: number of edits made by them
      if (edit != -1) {
        if (username in displayEntries) {
          displayEntries[username] += 1;
        } else {
          displayEntries[username] = 1;
        }
      } else {
        if (username in displayEntries) {
          if (displayEntries[username] == 0) {
            displayEntries[username] = 0;
          } else {
            displayEntries[username] -= 1;
          }
        } else {
          displayEntries[username] = 0;
        }
      }
    }

    function displayHistory(userSnapshot) {
      getHistory(userSnapshot);

      for (let userId in displayEntries) {
        var div = userEntries[userId];
        if (div) {
          userEntryList.removeChild(div);
          delete userEntries[userId];
        }
      }
      var div = userEntries["none"];
      if (div) {
        userEntryList.removeChild(div);
        delete userEntries["none"];
      }

      console.log(displayEntries);
      // TO DO: create html to display the information
      //var pieDiv = elt('div', userEntries[username], { 'class': 'piechart', 'style' : '' }); // change HTML style of piechart in code.html to be able to change the size variables rather than having it in the CSS file
      // colorDiv.style.backgroundColor = color;

      //test adding user edits
      // want to append a child <p> with username, color, and number of edits made by them
      if (Object.keys(displayEntries).length == 1) {
        var nonePar = elt("p", "There are no edits.", {
          class: "test-user-edits"
        });
        userEntries["none"] = nonePar;
        userEntryList.appendChild(nonePar);
      } else {
        for (let k in displayEntries) {
          if (k != "") {
            var userDiv = elt(
              "p",
              k + " has " + displayEntries[k] + " edits.",
              { class: "test-user-edits" }
            ); // How would I add the user color in here as a style?
            userEntries[k] = userDiv;
            userEntryList.appendChild(userDiv);
            // var pieDiv = elt("div", {class : "pie-chart"});
          }
        }
      }

      console.log(userEntries);
    }

    function getDisplayName(userSnapshot) {
      // get display name from users and add to dictionary with usernames and userIds
    }



    //listeners for when things are changed in the database for the history
    this.firebaseOn_(this.ref_.child("history"), "child_added", displayHistory);
    this.firebaseOn_(this.ref_.child("users"), "child_added", getDisplayName);
    this.firebaseOn_(this.ref_.child("users"), "child_changed", getDisplayName);
    this.firebaseOn_(
      this.ref_.child("history"),
      "child_changed",
      displayHistory
    );
    this.firebaseOn_(this.ref_.child("history"), "child_moved", displayHistory);
    console.log(userEntryList);
    return userEntryList;
  };

  /** below here are helper functions you do not need to change */
  FirepadHistoryList.prototype.firebaseOn_ = function(
    ref,
    eventType,
    callback,
    context
  ) {
    this.firebaseCallbacks_.push({
      ref: ref,
      eventType: eventType,
      callback: callback,
      context: context
    });
    ref.on(eventType, callback, context);
    return callback;
  };

  FirepadHistoryList.prototype.firebaseOff_ = function(
    ref,
    eventType,
    callback,
    context
  ) {
    ref.off(eventType, callback, context);
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      if (
        l.ref === ref &&
        l.eventType === eventType &&
        l.callback === callback &&
        l.context === context
      ) {
        this.firebaseCallbacks_.splice(i, 1);
        break;
      }
    }
  };

  FirepadHistoryList.prototype.removeFirebaseCallbacks_ = function() {
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      l.ref.off(l.eventType, l.callback, l.context);
    }
    this.firebaseCallbacks_ = [];
  };

  /** Assorted helpers */

  function isValidColor(color) {
    return (
      typeof color === "string" &&
      (color.match(/^#[a-fA-F0-9]{3,6}$/) || color == "transparent")
    );
  }

  /** DOM helpers */
  function elt(tag, content, attrs) {
    var e = document.createElement(tag);
    if (typeof content === "string") {
      setTextContent(e, content);
    } else if (content) {
      for (var i = 0; i < content.length; ++i) {
        e.appendChild(content[i]);
      }
    }
    for (var attr in attrs || {}) {
      e.setAttribute(attr, attrs[attr]);
    }
    return e;
  }

  function setTextContent(e, str) {
    e.innerHTML = "";
    e.appendChild(document.createTextNode(str));
  }

  function on(emitter, type, f) {
    if (emitter.addEventListener) {
      emitter.addEventListener(type, f, false);
    } else if (emitter.attachEvent) {
      emitter.attachEvent("on" + type, f);
    }
  }

  function off(emitter, type, f) {
    if (emitter.removeEventListener) {
      emitter.removeEventListener(type, f, false);
    } else if (emitter.detachEvent) {
      emitter.detachEvent("on" + type, f);
    }
  }

  function preventDefault(e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
  }

  function stopPropagation(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }

  function stopEvent(e) {
    preventDefault(e);
    stopPropagation(e);
  }

  return FirepadHistoryList;
})();
