/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence. */

import React, { Component } from "react";
import AddTagAutoComplete from "./AddTagAutoComplete";
import TextField from "@mui/material/TextField";
import FlatButton from "@mui/material/Button";

class AddTagDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      comment: "",
      tagName: "",
      searchText: "",
    };
  }

  handleChooseTag(tagName, comment) {
    if (!tagName) {
      this.setState({
        searchText: "",
      });
      return;
    }
    if (comment) {
      this.setState({
        tagName,
        comment,
        searchText: tagName,
      });
    } else {
      this.setState({
        tagName,
        searchText: tagName,
      });
    }

    if (this.refs.comment) {
      this.refs.comment.focus();
    }
  }

  handleAddTag() {
    const { comment, tagName } = this.state;
    const { idReference, handleLoading, addTag, getTags } = this.props;

    handleLoading(true);

    addTag(idReference, tagName, comment)
      .then((result) => {
        this.setState({
          comment: "",
          tagName: "",
          searchText: "",
        });
        getTags(idReference)
          .then((response) => {
            handleLoading(false);
          })
          .catch((err) => {
            handleLoading(false);
          });
      })
      .catch((err) => {
        handleLoading(false);
      });
  }

  render() {
    const { comment, tagName, searchText } = this.state;
    const { intl } = this.props;
    const { formatMessage } = intl;

    return (
      <div
        style={{
          borderTop: "1px dotted",
          display: "flex",
          flexDirection: "column",
          marginLeft: 5,
          marginBottom: 10,
          paddingTop: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <AddTagAutoComplete
            style={{ marginLeft: 10, width: 350 }}
            tagName={tagName}
            searchText={searchText}
            handleInputChange={(value) => {
              debugger;
              this.setState({ searchText: value });
            }}
            handleChooseTag={this.handleChooseTag.bind(this)}
            findTagByName={this.props.findTagByName}
          />
        </div>
        <TextField
          value={comment}
          floatingLabelText={formatMessage({ id: "comment" })}
          hintText={formatMessage({ id: "comment" })}
          style={{ marginLeft: 10, width: 350 }}
          ref="comment"
          id={"comment-text"}
          onChange={(e, v) => this.setState({ comment: v || "" })}
        />
        <FlatButton
          label={formatMessage({ id: "add" })}
          style={{ width: "30%", margin: "auto" }}
          disabled={!tagName}
          onClick={this.handleAddTag.bind(this)}
        />
      </div>
    );
  }
}

export default AddTagDialog;
