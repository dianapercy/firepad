var FirepadHistoryList = (function() {
  function FirepadHistoryList(ref, place, pieChartPlace, userId, displayName) {
    if (!(this instanceof FirepadHistoryList)) {
      return new FirepadHistoryList(ref, place, pieChartPlace, userId, displayName);
    }

    this.ref_ = ref;
    this.userId_ = userId;
    this.place_ = place;
    this.firebaseCallbacks_ = [];

    var self = this;

    // what you have built in this file is added to the element passed in
    this.userEntryList_ = this.makeUserList_(pieChartPlace);
    place.appendChild(this.userEntryList_);
  }

  // This is the primary "constructor" for symmetry with Firepad.
  FirepadHistoryList.fromDiv = FirepadHistoryList;

  FirepadHistoryList.prototype.makeUserList_ = function(pieChartPlace) {
    /** the primary function for creating the layout,
     * other functions called from here
     */

    //return elt('div', [
    //  this.makeHeading_(),
    //  elt('div', [this.makeUserEntries_()], {'class': 'userlist' })], {'class': 'userlist' });
    return elt("div", [
      this.makeHeading_(),
      elt("div", [this.makeUserEntries_(pieChartPlace)], { class: "userlist" })
    ]);
  };

  FirepadHistoryList.prototype.makeHeading_ = function() {
    /** header */
    //return elt('div', [
    //  elt('span', 'View Collaboration Metrics')], { 'class': 'userlist' });
    return elt("div", [elt("span", "Collaboration Metrics")]);
  };

  FirepadHistoryList.prototype.makeUserEntries_ = function(pieChartPlace) {
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
    var displayDeletions = {};
    var userIdToDisplayName = {};
    var userColors = [];

    function getHistory(userSnapshot) {
      /*
       * This function gets data about the changes made to the firepad
       */
      var editId = userSnapshot.key;

      // Get the information about the edit if it is not the first default edit
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
      }

      // Accumulate the number of additions/deletions made by a certain user into dictionary displayEntries and displayDeletions
      // key: userId, value: number of additions/deletions made by them
      if (edit != -1) { // If addition
        if (username in displayEntries) {
          displayEntries[username] += 1;
        } else {
          displayEntries[username] = 1;
        }
      } 
      else { // If deletion
        if (username in displayDeletions) {
          displayDeletions[username] += 1;
        }
        else {
          displayDeletions[username] = 1;
        }
      }
    }

    function displayHistory(userSnapshot) {
      getHistory(userSnapshot);
      var pieChartData = [["User", "Edits"]];

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

      // console.log(displayEntries);
      // TO DO: create html to display the information
     
      //test adding user edits
      // want to append a child <p> with username, color, and number of edits made by them
      if (Object.keys(displayEntries).length == 1) {
        var nonePar = elt("p", "There are no edits.", {
          class: "test-user-edits"
        });
        userEntries["none"] = nonePar;
        userEntryList.appendChild(nonePar);
      } 
      else {
        for (let k in displayEntries) {
          displayName = userIdToDisplayName[k];
          if (k != "") {
            var userDiv = elt(
              "p",
              displayName + " has " + displayEntries[k] + " additions and " + displayDeletions[k] + " deletions.",
              { class: "test-user-edits" }
            );
            userEntries[k] = userDiv;
            userEntryList.appendChild(userDiv);
            pieChartData.push([displayName, displayEntries[k]]);
          }
        }
      }
      var data = google.visualization.arrayToDataTable(pieChartData);

      var options = {
        backgroundColor: {color: "#111", fill: "#111", stroke: "#111"},
        chartArea: {backgroundColor: "#111", width: "75%", height: "75%"},
        legend: {position: "left", textStyle: {color: "white", fontSize: 8, fontName: "Verdana"}},
        colors: userColors
      };
      // Want to pull colors from database

      var chart = new google.visualization.PieChart(pieChartPlace);
      // See if we can append chart as a child to userEntryList

      chart.draw(data, options);
    }

    function getDisplayInfo(userSnapshot) {
      /* 
      Gets displayName from database and puts into 
      dictionary userIdToDisplayName with key: userId and value: displayName
      Is called by listener anytime a child is changed or added 
      */
      var userId = userSnapshot.key;
      displayName = "";
      displayColor = "";

      displayName = userSnapshot.child("name").val();
      displayColor = userSnapshot.child("color").val();
      if (displayName != null) {
        userIdToDisplayName[userId] = displayName;
      }
      var hasColor = userColors.includes(displayColor);
      if (hasColor == false) {
        userColors.unshift(displayColor);
      }
      console.log(userColors);
    }

    google.charts.load("current", { packages: ["corechart"] });
    //listeners for when things are changed in the database for the history
    this.firebaseOn_(this.ref_.child("history"), "child_added", displayHistory);
    this.firebaseOn_(this.ref_.child("users"), "child_added", getDisplayInfo);
    this.firebaseOn_(this.ref_.child("users"), "child_changed", getDisplayInfo);
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
